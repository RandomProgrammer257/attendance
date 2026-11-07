import asyncio
import concurrent.futures
import os
import queue
import threading
import time
from datetime import datetime

import aiohttp
import cv2
import numpy as np
from fastapi import FastAPI
from insightface.app import FaceAnalysis

# НАСТРОЙКИ
JAVA_BACKEND_URL = "http://java-backend:8080/api/face/recognize"
TAPO_RTSP_URL = "rtsp://TapoCamera:TapoCamera11@10.109.190.73:554/stream2"

TZ_NAME = os.getenv("TZ_NAME", "Europe/Moscow")
try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None
# Распознавание
DET_SIZE = int(os.getenv("DET_SIZE", "640"))      # 960 лучше находит мелкие лица, но медленнее (у вас CPU)
MIN_DET_SCORE = 0.50      # минимальная уверенность детектора (слабая камера)
MIN_FACE_PX = 50          # минимальная ширина лица в пикселях
MIN_SHARPNESS = 20.0      # порог резкости (дисперсия Лапласиана)
MAX_YAW_POSE = 35         # максимальный поворот головы, градусы
FRAMES_PER_TRACK = 5      # сколько хороших кадров усреднять перед отправкой
RESEND_COOLDOWN = 30.0    # сек: не отправлять одного и того же человека чаще
TRACK_TTL = 3.0           # сек: через сколько забываем трек
PROCESS_EVERY_N = 3       # обрабатывать каждый N-й кадр из потока
ROOM = os.getenv("ROOM", "1-207")

app = FastAPI(title="Face Recognition Service")

executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
frame_queue = queue.Queue(maxsize=1)

executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)  # инференс в одном потоке
frame_queue: "queue.Queue" = queue.Queue(maxsize=1)

os.environ.setdefault(
    "OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp|fflags;nobuffer|flags;low_delay"
)


def local_now_iso() -> str:
    """Локальное время без таймзоны. Java сопоставляет его с расписанием,
    поэтому UTC (как было через utcnow) давало сдвиг на 3 часа."""
    if ZoneInfo is not None:
        try:
            return datetime.now(ZoneInfo(TZ_NAME)).replace(tzinfo=None).isoformat()
        except Exception:
            pass
    return datetime.now().isoformat()


# ---------------- Отправка в Java ----------------
async def send_to_java(session: aiohttp.ClientSession, embedding: list, location: str, timestamp: str):
    payload = {"vector": embedding, "room": location, "timestamp": timestamp}
    try:
        async with session.post(
                JAVA_BACKEND_URL, json=payload, timeout=aiohttp.ClientTimeout(total=5)
        ) as response:
            if response.status == 200:
                print(f"[INFO] Java ответ: {await response.json()}")
            else:
                print(f"[WARN] Java ошибка: {response.status}")
    except Exception as e:
        print(f"[ERROR] Connection error: {e}")


# ---------------- Чтение RTSP ----------------
def _open_capture():
    cap = cv2.VideoCapture(TAPO_RTSP_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    for _ in range(5):
        cap.grab()
    return cap


def reader_thread():
    """Отдельный поток: всегда читает самый свежий кадр, выбрасывает старые."""
    cap = _open_capture()
    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] reader: кадр не получен, переподключаюсь...")
            cap.release()
            time.sleep(2)
            cap = _open_capture()
            continue

        if not frame_queue.empty():
            try:
                frame_queue.get_nowait()
            except queue.Empty:
                pass
        try:
            frame_queue.put_nowait(frame)
        except queue.Full:
            pass


# ---------------- Треки и качество ----------------
def iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1])
    x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / area if area > 0 else 0.0


class Track:
    def __init__(self, bbox):
        self.bbox = bbox
        self.embeddings = []
        self.last_seen = time.time()
        self.last_sent = 0.0


def crop_of(image, bbox):
    h, w = image.shape[:2]
    x1, y1, x2, y2 = bbox
    return image[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]


def face_quality_ok(face, image) -> bool:
    x1, y1, x2, y2 = face.bbox.astype(int)
    if face.det_score < MIN_DET_SCORE or (x2 - x1) < MIN_FACE_PX:
        return False
    crop = crop_of(image, (x1, y1, x2, y2))
    if crop.size == 0:
        return False
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    if cv2.Laplacian(gray, cv2.CV_64F).var() < MIN_SHARPNESS:
        return False
    pose = getattr(face, "pose", None)  # pitch, yaw, roll
    if pose is not None and abs(pose[1]) > MAX_YAW_POSE:
        return False
    return True


# ---------------- Основной цикл ----------------
@app.get("/")
async def root():
    return {"status": "ok", "service": "face-recognition"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


async def process_stream():
    print("[INFO] process_stream started")
    face_app = FaceAnalysis(
        name="buffalo_l",
        allowed_modules=["detection", "recognition", "landmark_3d_68"],  # не грузим лишние модули
        providers=["CPUExecutionProvider"],
    )
    face_app.prepare(ctx_id=-1, det_size=(DET_SIZE, DET_SIZE), det_thresh=0.4)
    print("[INFO] model ready")

    threading.Thread(target=reader_thread, daemon=True).start()
    print(f"[INFO] reader thread started, room {ROOM}")

    loop = asyncio.get_running_loop()
    frame_count = 0
    tracks: list[Track] = []

    async with aiohttp.ClientSession() as session:
        while True:
            try:
                frame = await loop.run_in_executor(None, frame_queue.get, True, 5.0)
            except queue.Empty:
                print("[WARN] нет кадров 5 сек, ждём...")
                continue

            frame_count += 1
            if frame_count % PROCESS_EVERY_N != 0:
                continue

            # тяжёлый инференс — в отдельном потоке, event loop не блокируется
            faces = await loop.run_in_executor(executor, face_app.get, frame)
            now = time.time()

            for face in faces:
                bbox = face.bbox.astype(int).tolist()
                best = max(tracks, key=lambda t: iou(t.bbox, bbox), default=None)
                if best is None or iou(best.bbox, bbox) < 0.25:
                    best = Track(bbox)
                    tracks.append(best)
                best.bbox, best.last_seen = bbox, now

                if now - best.last_sent < RESEND_COOLDOWN:
                    continue
                if not face_quality_ok(face, frame):
                    continue

                best.embeddings.append(face.normed_embedding)  # уже L2-нормализован

                if len(best.embeddings) >= FRAMES_PER_TRACK:
                    mean = np.mean(best.embeddings, axis=0)
                    mean /= np.linalg.norm(mean)  # усреднённый и нормализованный вектор
                    best.embeddings.clear()
                    best.last_sent = now

                    print("[INFO] sending to Java...")
                    asyncio.create_task(
                        send_to_java(session, mean.astype(float).tolist(), ROOM, local_now_iso())
                    )

            tracks = [t for t in tracks if now - t.last_seen < TRACK_TTL]


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_stream())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

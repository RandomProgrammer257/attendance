import asyncio
import queue
import threading
from datetime import datetime
import aiohttp
import cv2
from fastapi import FastAPI
from insightface.app import FaceAnalysis

JAVA_BACKEND_URL = "http://java-backend:8080/api/face/recognize"
TAPO_RTSP_URL = "rtsp://172.17.0.1:8554/tapo"
LOCATION = "1-207"

app = FastAPI(title="Face Recognition Service")
frame_queue = queue.Queue(maxsize=1)


async def send_to_java(embedding: list, location: str, timestamp: str):
    try:
        async with aiohttp.ClientSession() as session:
            payload = {"vector": embedding, "room": location, "timestamp": timestamp}
            async with session.post(
                JAVA_BACKEND_URL, json=payload, timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"[INFO] Java ответ: {result}")
                    return result
                print(f"[INFO] Java ошибка: {response.status}")
                return None
    except Exception as e:
        print(f"[INFO] Connection error: {e}")
        return None


def reader_thread():
    """Отдельный поток: всегда читает самый свежий кадр, выбрасывает старые."""
    import os
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

    cap = cv2.VideoCapture(TAPO_RTSP_URL, cv2.CAP_FFMPEG)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    for _ in range(5):
        cap.grab()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARN] reader: кадр не получен, переподключаюсь...")
            cap.release()
            import time
            time.sleep(2)
            cap = cv2.VideoCapture(TAPO_RTSP_URL, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            for _ in range(5):
                cap.grab()
            continue

        # Выбросить старый кадр, положить свежий
        if not frame_queue.empty():
            try:
                frame_queue.get_nowait()
            except queue.Empty:
                pass
        try:
            frame_queue.put(frame, block=False)
        except queue.Full:
            pass


@app.get("/")
async def root():
    return {"status": "ok", "service": "face-recognition"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


async def process_stream():
    print("[INFO] process_stream started")
    face_app = FaceAnalysis(name="buffalo_l")
    face_app.prepare(ctx_id=-1, det_size=(640, 640))
    print("[INFO] model ready")

    threading.Thread(target=reader_thread, daemon=True).start()
    print("[INFO] reader thread started")

    loop = asyncio.get_event_loop()
    frame_count = 0

    while True:
        try:
            frame = await loop.run_in_executor(None, frame_queue.get, True, 5.0)
        except queue.Empty:
            print("[WARN] нет кадров 5 сек, ждём...")
            continue

        frame_count += 1
        if frame_count % 5 != 0:
            continue

        print(f"[INFO] frame shape: {frame.shape}, mean: {frame.mean():.1f}")
        faces = face_app.get(frame)
        print(f"[INFO] faces raw: {len(faces)}")
        for f in faces:
            print(f"[INFO] det_score: {f.det_score:.3f}, bbox: {f.bbox}")
        faces = [f for f in faces if f.det_score > 0.5]
        print(f"[INFO] faces filtered: {len(faces)}")

        if faces:
            print(f"[INFO] faces detected: {len(faces)}")
        for face in faces:
            embedding = face.normed_embedding.tolist()
            print("[INFO] sending to Java...")
            await send_to_java(
                embedding=embedding,
                location=LOCATION,
                timestamp=datetime.utcnow().isoformat(),
            )
        await asyncio.sleep(0.01)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_stream())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
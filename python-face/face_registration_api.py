from typing import List

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from insightface.app import FaceAnalysis

app = FastAPI(title="Face Registration Service")

# Та же модель, что и в фейс-симпл
face_app = FaceAnalysis(
    name="buffalo_l",
    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
)
face_app.prepare(ctx_id=0, det_size=(640, 640))

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_PHOTOS = 5

# Пороги качества (для регистрации они строже, чем для камеры)
MIN_DET_SCORE = 0.80
MIN_FACE_PX = 150
MIN_SHARPNESS = 60.0
MAX_YAW = 30
MAX_PITCH = 25


def normalize(v: np.ndarray) -> np.ndarray:
    return v / np.linalg.norm(v)


def decode(image_bytes: bytes, name: str) -> np.ndarray:
    if not image_bytes:
        raise HTTPException(400, f"{name}: файл пустой")
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, f"{name}: размер изображения не должен превышать 10 МБ")
    image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(400, f"{name}: не удалось прочитать изображение")
    return image


def extract_embedding(image: np.ndarray, name: str) -> np.ndarray:
    """Проверяет качество фото и возвращает нормализованный вектор лица.
    Усредняет оригинал и зеркальное отражение для устойчивости."""
    faces = face_app.get(image)
    if len(faces) == 0:
        raise HTTPException(422, f"{name}: на фотографии не найдено лицо")
    if len(faces) > 1:
        raise HTTPException(422, f"{name}: на фотографии должно быть только одно лицо")

    face = faces[0]
    x1, y1, x2, y2 = face.bbox.astype(int)
    h, w = image.shape[:2]

    if face.det_score < MIN_DET_SCORE:
        raise HTTPException(422, f"{name}: лицо плохо различимо (уверенность {face.det_score:.2f})")
    if (x2 - x1) < MIN_FACE_PX:
        raise HTTPException(422, f"{name}: лицо слишком маленькое ({x2 - x1} px), нужно минимум {MIN_FACE_PX} px")

    crop = image[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    if cv2.Laplacian(gray, cv2.CV_64F).var() < MIN_SHARPNESS:
        raise HTTPException(422, f"{name}: фотография размытая")

    pose = getattr(face, "pose", None)  # pitch, yaw, roll
    if pose is not None:
        if abs(pose[1]) > MAX_YAW or abs(pose[0]) > MAX_PITCH:
            raise HTTPException(422, f"{name}: лицо должно быть повёрнуто к камере (анфас)")

    emb = face.normed_embedding.astype(np.float64)

    # Зеркальное отражение — вторая «версия» того же лица
    flipped = face_app.get(cv2.flip(image, 1))
    if len(flipped) == 1:
        emb = normalize(emb + flipped[0].normed_embedding.astype(np.float64))

    return emb


# Обычные def (не async): тяжёлый инференс выполняется в пуле потоков и не блокирует сервер.
@app.post("/register")
def register_face(file: UploadFile = File(...)):
    """Один студент — одно фото. Формат ответа прежний: {"vector": [...]}"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Загрузите файл изображения")
    image = decode(file.file.read(), file.filename or "фото")
    emb = extract_embedding(image, file.filename or "фото")
    return {"vector": emb.tolist()}


@app.post("/register-multi")
def register_multi(files: List[UploadFile] = File(...)):
    """Несколько фото одного студента (рекомендуется 2-3).
    Возвращает усреднённый вектор и векторы по отдельным фото."""
    if not files:
        raise HTTPException(400, "Загрузите хотя бы одно фото")
    if len(files) > MAX_PHOTOS:
        raise HTTPException(400, f"Не более {MAX_PHOTOS} фото")

    embeddings = []
    for f in files:
        name = f.filename or "фото"
        if not f.content_type or not f.content_type.startswith("image/"):
            raise HTTPException(400, f"{name}: загрузите файл изображения")
        embeddings.append(extract_embedding(decode(f.file.read(), name), name))

    mean = normalize(np.mean(embeddings, axis=0))

    # Проверка: все фото должны быть одним человеком
    sims = [float(np.dot(e, mean)) for e in embeddings]
    if min(sims) < 0.5:
        raise HTTPException(422, "Фотографии, похоже, разных людей или сильно отличаются")

    return {
        "vector": mean.tolist(),
        "vectors": [e.tolist() for e in embeddings],
        "photoCount": len(embeddings),
    }


@app.get("/health")
def health():
    return {"status": "ok"}

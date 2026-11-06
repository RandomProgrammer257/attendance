import os
import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from insightface.app import FaceAnalysis

app = FastAPI(title="Face Registration Service")

# Используем ту же модель, что и при распознавании с камеры.
face_app = FaceAnalysis(name="buffalo_l")
face_app.prepare(ctx_id=0, det_size=(640, 640))


@app.post("/register")
async def register_face(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Загрузите файл изображения"
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Файл пустой")

    # Ограничиваем размер загружаемого файла — 10 МБ.
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Размер изображения не должен превышать 10 МБ"
        )

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Не удалось прочитать изображение"
        )

    faces = face_app.get(image)

    if len(faces) == 0:
        raise HTTPException(
            status_code=422,
            detail="На фотографии не найдено лицо"
        )

    if len(faces) > 1:
        raise HTTPException(
            status_code=422,
            detail="На фотографии должно быть только одно лицо"
        )

    embedding = faces[0].normed_embedding.astype(float).tolist()

    return {
        "vector": embedding
    }


@app.get("/health")
def health():
    return {"status": "ok"}

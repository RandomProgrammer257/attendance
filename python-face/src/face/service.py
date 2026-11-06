from insightface.app import FaceAnalysis


class FaceService:
    def __init__(self):
        self._face_app = FaceAnalysis(
            name='buffalo_l',
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider'],
            allowed_modules=['detection', 'recognition']
        )
        self._face_app.prepare(ctx_id=0, det_size=(640, 640))

    def get_faces(self, image):
        return self._face_app.get(image)


FROM python:3.11-slim

WORKDIR /app

# Установка системных зависимостей для face-recognition
RUN apt-get update && apt-get install -y \
    ffmpeg \
    cmake \
    build-essential \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    libboost-all-dev \
    && rm -rf /var/lib/apt/lists/*

# Копируем зависимости и устанавливаем
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь код
COPY . .

# Порт для FastAPI
EXPOSE 8001

# Запуск сервера
CMD ["sh", "-c", "uvicorn face_simple:app --host 0.0.0.0 --port 8001 & uvicorn face_registration_api:app --host 0.0.0.0 --port 8002"]

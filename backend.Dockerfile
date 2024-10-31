FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend
COPY backend/ .backend.env

ENV PYTHONPATH=/app/backend
ENV MONGO_URI=mongodb://mongodb:27017
ENV DB_NAME=rag_db

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5984"]
CMD ["python3", "./backend/main.py"]
# CMD ["python3", "-m", "debugpy", "--wait-for-client", "--listen", "0.0.0.0:5678", "./backend/main.py"]

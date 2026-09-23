FROM python:3.13-slim

WORKDIR /app/backend

ENV PYTHONPATH="/app:/app/backend"

COPY requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/app /app/backend/app
COPY ml /app/ml
COPY notebooks /app/notebooks
COPY pipeline /app/pipeline
COPY data /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
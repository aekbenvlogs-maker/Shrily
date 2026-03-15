# --- Production Dockerfile for FastAPI app ---
FROM python:3.11-slim as base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY ./src ./src
COPY ./alembic.ini ./
COPY ./config ./config

# Expose port
EXPOSE 8000

# Entrypoint
CMD ["uvicorn", "src.applicatif.main:app", "--host", "0.0.0.0", "--port", "8000"]

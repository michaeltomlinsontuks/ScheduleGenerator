# PDF Worker Dockerfile
# Python microservice for parsing UP schedule PDFs

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for pdfplumber and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpoppler-cpp-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash worker
USER worker

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/health')" || exit 1

# Run with Gunicorn - use environment variables for configuration
CMD gunicorn app:app \
    -w ${MAX_WORKERS:-4} \
    -k uvicorn.workers.UvicornWorker \
    -b 0.0.0.0:5001 \
    --timeout ${WORKER_TIMEOUT:-120} \
    --max-requests ${MAX_REQUESTS:-1000} \
    --max-requests-jitter ${MAX_REQUESTS_JITTER:-100} \
    --access-logfile - \
    --error-logfile - \
    --log-level info

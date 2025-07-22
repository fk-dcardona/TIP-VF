# Railway-optimized Dockerfile for Flask Backend
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python files
COPY *.py ./
COPY routes/ ./routes/
COPY backend/ ./backend/
COPY services/ ./services/

# Create necessary directories
RUN mkdir -p uploads data

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=main.py
ENV PYTHONUNBUFFERED=1
ENV PORT=5000

# Run the Flask app
CMD ["python", "main.py"]
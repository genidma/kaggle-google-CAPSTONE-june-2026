# Use official lightweight Python image
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies if any are needed (e.g. git, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker build cache
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application files
COPY . .

# Expose port (default for Cloud Run is 8080)
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["python", "app.py"]

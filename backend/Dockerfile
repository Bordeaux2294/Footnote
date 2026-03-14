FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    gcc \
    portaudio19-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install torch first so it gets cached separately
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu torch
RUN pip install -r requirements.txt

COPY . .
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]

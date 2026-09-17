FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    FLUENTAI_WHISPER_MODEL=tiny

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt ./
RUN pip install --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

COPY . ./
# Download the model during image build, never on a visitor's device.
RUN python -c "import whisper; whisper.load_model('tiny')"

EXPOSE 10000
CMD sh -c 'uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}'

from pathlib import Path
from contextlib import asynccontextmanager
from collections import Counter
import threading
import logging

import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException
from ultralytics import YOLO

from detect import predict, caption, load_coco, LABEL_ID


# ============================================================
# 1. KONFIGURASI
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "best.pt"
COCO_PATH = BASE_DIR / "yolov8n.pt"

MAX_IMAGE_SIZE = 8 * 1024 * 1024

CONFIDENCE = 0.4
IOU = 0.5
IMAGE_SIZE = 640

model = None
coco = None
model_lock = threading.Lock()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BananaVision")


# ============================================================
# 2. LOAD MODEL
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, coco

    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Model YOLO tidak ditemukan: {MODEL_PATH}"
        )

    logger.info("Memuat best.pt...")
    model = YOLO(str(MODEL_PATH))

    logger.info("Kelas model: %s", model.names)

    if COCO_PATH.is_file():
        logger.info("Memuat filter COCO...")
        coco = load_coco(str(COCO_PATH))
    else:
        logger.warning(
            "yolov8n.pt tidak ditemukan. "
            "Deteksi berjalan tanpa filter COCO."
        )
        coco = None

    logger.info("BananaVision YOLO API siap!")
    yield

    logger.info("BananaVision YOLO API berhenti.")


# ============================================================
# 3. FASTAPI
# ============================================================

app = FastAPI(
    title="BananaVision YOLO API",
    description=(
        "API deteksi kematangan pisang untuk "
        "Laravel: gambar, webcam, dan frame video."
    ),
    version="1.1.0",
    lifespan=lifespan
)


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "BananaVision YOLO API berjalan",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "coco_loaded": coco is not None,
        "classes": model.names if model is not None else {}
    }


# ============================================================
# 4. VALIDASI GAMBAR
# ============================================================

def decode_image(upload: UploadFile):
    raw = upload.file.read(MAX_IMAGE_SIZE + 1)

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="File gambar kosong."
        )

    if len(raw) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Ukuran gambar maksimal 8 MB."
        )

    # Periksa signature file, bukan hanya MIME header.
    if raw.startswith(b"\xff\xd8\xff"):
        file_format = "jpeg"

    elif raw.startswith(b"\x89PNG\r\n\x1a\n"):
        file_format = "png"

    elif (
        raw.startswith(b"RIFF")
        and raw[8:12] == b"WEBP"
    ):
        file_format = "webp"

    else:
        raise HTTPException(
            status_code=422,
            detail="Format harus JPG, PNG, atau WEBP."
        )

    frame = cv2.imdecode(
        np.frombuffer(raw, dtype=np.uint8),
        cv2.IMREAD_COLOR
    )

    if frame is None:
        raise HTTPException(
            status_code=422,
            detail="Gambar tidak dapat dibaca."
        )

    return frame, file_format


# ============================================================
# 5. KONVERSI HASIL DETEKSI
# ============================================================

def format_detections(result, names):
    detections = []

    if result.boxes is None:
        return detections

    for box in result.boxes:
        class_id = int(box.cls.item())
        class_name = names[class_id]

        label = LABEL_ID.get(
            class_name,
            class_name
        )

        confidence = float(box.conf.item())

        x1, y1, x2, y2 = [
            float(value)
            for value in box.xyxy[0].tolist()
        ]

        detections.append({
            "class_id": class_id,
            "class_name": class_name,
            "label": label.capitalize(),
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2],
            "caption": (
                f"Pisang {label} terdeteksi "
                f"dengan confidence "
                f"{confidence * 100:.1f}%."
            )
        })

    return detections


# ============================================================
# 6. ENDPOINT PREDIKSI
# ============================================================

@app.post("/predict")
def predict_image(image: UploadFile = File(...)):
    try:
        if model is None:
            raise HTTPException(
                status_code=503,
                detail="Model YOLO belum siap."
            )

        frame, file_format = decode_image(image)

        image_height, image_width = frame.shape[:2]

        logger.info(
            "Menerima file=%s, format=%s, "
            "mime=%s, ukuran=%sx%s",
            image.filename,
            file_format,
            image.content_type,
            image_width,
            image_height
        )

        # Lock menjaga pemanggilan kedua model
        # agar tidak bertabrakan antar request.
        with model_lock:
            result = predict(
                model,
                frame,
                coco=coco,
                conf=CONFIDENCE,
                iou=IOU,
                imgsz=IMAGE_SIZE,
                verbose=False
            )

            names = model.names

            detections = format_detections(
                result,
                names
            )

            final_caption = caption(
                result,
                names
            )

        counts = Counter(
            item["class_name"]
            for item in detections
        )

        response_data = {
            "success": True,
            "image_width": int(image_width),
            "image_height": int(image_height),
            "total_detections": len(detections),
            "caption": final_caption,
            "counts": dict(counts),
            "detections": detections
        }

        logger.info(
            "Prediksi berhasil: %s objek",
            len(detections)
        )

        return response_data

    except HTTPException:
        raise

    except Exception as error:
        logger.exception(
            "Kesalahan saat inference YOLO"
        )

        raise HTTPException(
            status_code=500,
            detail="Gagal memproses gambar dengan YOLO."
        ) from error

    finally:
        image.file.close()


# ============================================================
# 7. RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001
    )

"""
Deteksi kematangan pisang + caption otomatis.
  python detect.py --mode image  --source foto.jpg
  python detect.py --mode video  --source video.mp4 --out hasil.mp4
  python detect.py --mode webcam                       (tekan 'q' untuk keluar)
"""
import argparse, time, cv2
from collections import Counter
from ultralytics import YOLO

LABEL_ID = {"Unripe": "mentah", "Ripe": "matang", "Overripe": "terlalu matang"}
COLOR = {"Unripe": (60, 200, 60), "Ripe": (0, 215, 255), "Overripe": (40, 40, 230)}  # BGR

def caption(r, names):
    if r.boxes is None or len(r.boxes) == 0:
        return "Tidak ada pisang terdeteksi"
    c = Counter(names[int(i)] for i in r.boxes.cls.tolist())
    parts = [f"{n} pisang {LABEL_ID[k]}" for k, n in c.most_common()]
    return "Terdeteksi " + ", ".join(parts)

def draw(frame, r, names, fps=None):
    for b in r.boxes:
        k = names[int(b.cls)]; x1, y1, x2, y2 = map(int, b.xyxy[0])
        cv2.rectangle(frame, (x1, y1), (x2, y2), COLOR[k], 2)
        t = f"{LABEL_ID[k]} {float(b.conf):.2f}"
        (w, h), _ = cv2.getTextSize(t, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (x1, y1 - h - 6), (x1 + w + 4, y1), COLOR[k], -1)
        cv2.putText(frame, t, (x1 + 2, y1 - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
    cap = caption(r, names) + (f" | {fps:.0f} FPS" if fps else "")
    cv2.rectangle(frame, (0, 0), (frame.shape[1], 30), (0, 0, 0), -1)
    cv2.putText(frame, cap, (8, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
    return frame

COCO_BANANA = 46  # id kelas "banana" di COCO

def load_coco(path="yolov8n.pt"):
    """Model COCO bawaan (auto-download). Dipakai buat nyaring false positive (muka, HP, dll)."""
    return YOLO(path)

def keep_idx(boxes_xyxy, banana_xyxy, thr=0.4):
    """Index kotak model kita yang minimal `thr` luasnya tumpang tindih dengan kotak 'banana' COCO."""
    keep = []
    for i, (x1, y1, x2, y2) in enumerate(boxes_xyxy):
        area = max((x2 - x1) * (y2 - y1), 1e-6)
        for bx1, by1, bx2, by2 in banana_xyxy:
            iw = min(x2, bx2) - max(x1, bx1); ih = min(y2, by2) - max(y1, by1)
            if iw > 0 and ih > 0 and iw * ih / area >= thr:
                keep.append(i); break
    return keep

def predict(model, frame, coco=None, **kw):
    """Prediksi model kita; kalau `coco` diberikan, buang kotak yang bukan area pisang menurut COCO."""
    r = model.predict(frame, **kw)[0]
    if coco is None or r.boxes is None or len(r.boxes) == 0:
        return r
    c = coco.predict(frame, classes=[COCO_BANANA], conf=0.10, imgsz=kw.get("imgsz", 640), verbose=False)[0]
    ban = c.boxes.xyxy.cpu().numpy().tolist() if c.boxes is not None else []
    keep = keep_idx(r.boxes.xyxy.cpu().numpy().tolist(), ban)
    return r[keep] if keep else r[[]]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["image", "video", "webcam"], required=True)
    ap.add_argument("--source", default=None)
    ap.add_argument("--weights", default="best.pt")
    ap.add_argument("--conf", type=float, default=0.4)
    ap.add_argument("--iou", type=float, default=0.5)
    ap.add_argument("--imgsz", type=int, default=960)
    ap.add_argument("--out", default=None)
    ap.add_argument("--cam", type=int, default=0)
    ap.add_argument("--nofilter", action="store_true", help="matikan filter COCO")
    a = ap.parse_args()
    model = YOLO(a.weights); names = model.names
    kw = dict(conf=a.conf, iou=a.iou, imgsz=a.imgsz, verbose=False)
    coco = None if a.nofilter else load_coco()

    if a.mode == "image":
        r = predict(model, a.source, coco, **kw)
        img = draw(r.orig_img.copy(), r, names); print(caption(r, names))
        out = a.out or "hasil.jpg"; cv2.imwrite(out, img); print("Disimpan:", out); return

    cap = cv2.VideoCapture(a.cam if a.mode == "webcam" else a.source)
    if not cap.isOpened(): raise SystemExit("Sumber video/webcam tidak bisa dibuka")
    writer = None
    if a.mode == "video":
        fps_in = cap.get(cv2.CAP_PROP_FPS) or 25
        W, H = int(cap.get(3)), int(cap.get(4))
        writer = cv2.VideoWriter(a.out or "hasil.mp4", cv2.VideoWriter_fourcc(*"mp4v"), fps_in, (W, H))
    prev = time.time(); fps = 0
    while True:
        ok, frame = cap.read()
        if not ok: break
        r = predict(model, frame, coco, **kw)
        now = time.time(); fps = 0.9 * fps + 0.1 / max(now - prev, 1e-6); prev = now
        frame = draw(frame, r, names, fps)
        if writer: writer.write(frame)
        else:
            cv2.imshow("Banana Ripeness - tekan q untuk keluar", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"): break
    cap.release(); writer and writer.release(); cv2.destroyAllWindows()

if __name__ == "__main__":
    main()

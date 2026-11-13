# Deploy: streamlit run app.py   (Streamlit Community Cloud / HF Spaces)
# requirements.txt: streamlit ultralytics streamlit-webrtc av opencv-python-headless

from pathlib import Path
import tempfile, cv2, av, streamlit as st
from streamlit_webrtc import webrtc_streamer, RTCConfiguration
from ultralytics import YOLO
from detect import draw, caption, predict, load_coco

st.set_page_config(page_title="Deteksi Kematangan Pisang", page_icon="🍌", layout="wide")
st.title("🍌 Deteksi Kematangan Pisang")

BASE_DIR = Path(__file__).resolve().parent

@st.cache_resource
def load():
    return YOLO(str(BASE_DIR / "best.pt"))
@st.cache_resource
def load_f(): return load_coco()
model = load(); coco = load_f(); names = model.names
conf = st.sidebar.slider("Confidence", 0.1, 0.9, 0.4, 0.05)
imgsz = st.sidebar.selectbox("Image size", [640, 960], index=0)
use_filter = st.sidebar.checkbox("Filter anti false-positive (COCO)", value=True)
tab1, tab2, tab3 = st.tabs(["📷 Gambar", "🎞️ Video", "🔴 Webcam Real-time"])

with tab1:
    f = st.file_uploader("Upload gambar", type=["jpg", "jpeg", "png"], key="i")
    if f:
        p = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False); p.write(f.read()); p.flush()
        r = predict(model, p.name, coco if use_filter else None, conf=conf, imgsz=imgsz, verbose=False)
        st.image(cv2.cvtColor(draw(r.orig_img.copy(), r, names), cv2.COLOR_BGR2RGB))
        st.success(caption(r, names))

with tab2:
    v = st.file_uploader("Upload video", type=["mp4", "mov", "avi"], key="v")
    if v:
        p = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False); p.write(v.read()); p.flush()
        cap = cv2.VideoCapture(p.name); slot = st.empty(); cap_slot = st.empty(); n = 0
        while cap.isOpened():
            ok, fr = cap.read()
            if not ok: break
            n += 1
            if n % 2: continue                       # skip tiap 2 frame biar cepat
            r = predict(model, fr, coco if use_filter else None, conf=conf, imgsz=imgsz, verbose=False)
            slot.image(cv2.cvtColor(draw(fr, r, names), cv2.COLOR_BGR2RGB)); cap_slot.info(caption(r, names))
        cap.release()

with tab3:
    st.caption("Klik START lalu izinkan kamera.")
    def cb(frame):
        img = frame.to_ndarray(format="bgr24")
        r = predict(model, img, coco if use_filter else None, conf=conf, imgsz=640, verbose=False)
        return av.VideoFrame.from_ndarray(draw(img, r, names), format="bgr24")
    webrtc_streamer(key="cam", video_frame_callback=cb, media_stream_constraints={"video": True, "audio": False},
                    rtc_configuration=RTCConfiguration({"iceServers": [{"urls": ["stun:stun.l.google.com:19302"]}]}),
                    async_processing=True)

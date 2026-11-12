
document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    const webcam = $("webcam");
    const image = $("imagePreview");
    const video = $("videoPreview");
    const canvas = $("overlay");
    const ctx = canvas.getContext("2d");
    const stage = $("mediaStage");

    const capture = document.createElement("canvas");
    const captureCtx = capture.getContext("2d");

    const INTERVAL = 400;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

    let mode = "webcam";
    let stream = null;
    let mediaUrl = null;
    let imageFile = null;
    let active = false;
    let busy = false;
    let timer = null;
    let generation = 0;
    let lastResult = null;
    let videoReady = false;

    function setStatus(message) {
        $("statusText").textContent = message;
    }

    function setLive(value) {
        $("liveStatus").textContent = value ? "Live" : "Offline";
        $("liveDot").classList.toggle("active", value);
    }

    function clearOverlay() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        lastResult = null;
    }

    function resetResults() {
        clearOverlay();
        $("objectCount").textContent = "0 objek";
        $("emptyResult").hidden = false;
        $("resultContent").hidden = true;
        $("detectionList").replaceChildren();

        $("emptyResult").querySelector("h3").textContent =
            "Belum ada hasil analisis";
        $("emptyResult").querySelector("p").textContent =
            "Aktifkan kamera atau unggah media untuk melihat hasil deteksi.";
    }

    function stopLoop() {
        active = false;
        generation++;
        clearTimeout(timer);
        timer = null;
        setLive(false);
        $("toggleDetection").textContent = "Deteksi Otomatis";
    }

    function updateButtons() {
        $("startCamera").disabled = !!stream;
        $("stopCamera").disabled = !stream;
        $("toggleDetection").disabled = !stream;
        $("scanImage").disabled = !imageFile || busy;
        $("analyzeVideo").disabled = !videoReady;
    }

    function stopCamera() {
        stopLoop();

        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }

        webcam.pause();
        webcam.srcObject = null;
        webcam.hidden = true;
        updateButtons();
    }

    function clearFiles() {
        imageFile = null;
        videoReady = false;

        image.hidden = true;
        image.removeAttribute("src");

        video.pause();
        video.hidden = true;
        video.removeAttribute("src");
        video.load();

        if (mediaUrl) {
            URL.revokeObjectURL(mediaUrl);
            mediaUrl = null;
        }

        updateButtons();
    }

    function switchMode(next) {
        stopCamera();
        clearFiles();
        resetResults();

        mode = next;

        document.querySelectorAll(".mode").forEach(button => {
            const selected = button.dataset.mode === next;
            button.classList.toggle("active", selected);
            button.setAttribute("aria-pressed", String(selected));
        });

        $("webcamControls").hidden = next !== "webcam";
        $("imageControls").hidden = next !== "image";
        $("videoControls").hidden = next !== "video";
        $("mediaPlaceholder").hidden = false;

        const descriptions = {
            webcam: "Aktifkan kamera untuk memulai.",
            image: "Pilih gambar pisang dari perangkat.",
            video: "Pilih video MP4 atau WEBM."
        };

        const helpers = {
            webcam: "Deteksi otomatis berjalan setelah kamera aktif.",
            image: "Format JPG, PNG, WEBP. Maksimal 8 MB.",
            video: "Format MP4 atau WEBM. Maksimal 100 MB."
        };

        $("mediaPlaceholder").querySelector("p").textContent =
            descriptions[next];
        $("helperText").textContent = helpers[next];

        setStatus("Menunggu input");
        updateButtons();
    }

    async function startCamera() {
        if (mode !== "webcam" || stream) return;

        if (!navigator.mediaDevices?.getUserMedia) {
            alert("Webcam membutuhkan localhost atau HTTPS.");
            return;
        }

        const token = generation;

        try {
            setStatus("Meminta izin kamera...");
            $("startCamera").disabled = true;

            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (token !== generation || mode !== "webcam") {
                newStream.getTracks().forEach(t => t.stop());
                return;
            }

            stream = newStream;
            webcam.srcObject = stream;
            await webcam.play();

            if (token !== generation || mode !== "webcam") {
                stopCamera();
                return;
            }

            webcam.hidden = false;
            $("mediaPlaceholder").hidden = true;

            updateButtons();
            startLoop();
        } catch (error) {
            stopCamera();
            setStatus("Kamera gagal diaktifkan");
            alert(error.message);
        } finally {
            updateButtons();
        }
    }

    function startLoop() {
        if (active) return;
        if (mode === "webcam" && !stream) return;
        if (mode === "video" && video.paused) return;

        active = true;
        setLive(true);

        if (mode === "webcam") {
            $("toggleDetection").textContent = "Jeda Deteksi";
            setStatus("Kamera aktif · Deteksi otomatis");
        } else {
            setStatus("Analisis video berjalan");
        }

        runLoop();
    }

    function sourceElement() {
        if (mode === "webcam") return webcam;
        if (mode === "video") return video;
        return image;
    }

    function captureFrame() {
        return new Promise((resolve, reject) => {
            const source = sourceElement();

            const width = mode === "image"
                ? source.naturalWidth
                : source.videoWidth;

            const height = mode === "image"
                ? source.naturalHeight
                : source.videoHeight;

            if (!width || !height) {
                reject(new Error("Media belum siap."));
                return;
            }

            const scale = Math.min(
                1,
                640 / Math.max(width, height)
            );

            capture.width = Math.max(1, Math.round(width * scale));
            capture.height = Math.max(1, Math.round(height * scale));

            captureCtx.drawImage(
                source,
                0, 0,
                capture.width,
                capture.height
            );

            capture.toBlob(blob => {
                if (blob) resolve(blob);
                else reject(new Error("Gagal mengambil frame."));
            }, "image/jpeg", 0.85);
        });
    }

    async function predict(blob) {
        const form = new FormData();
        form.append("image", blob, "frame.jpg");

        const response = await fetch(window.BANANA.endpoint, {
            method: "POST",
            headers: {
                "X-CSRF-TOKEN": window.BANANA.csrf,
                "Accept": "application/json"
            },
            body: form
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.errors?.image?.[0] ||
                data.message ||
                "Gagal menghubungi server YOLO."
            );
        }

        return data;
    }

    function drawBoxes(data) {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const iw = data.image_width;
        const ih = data.image_height;

        if (!iw || !ih) return;

        const scale = Math.min(width / iw, height / ih);
        const offsetX = (width - iw * scale) / 2;
        const offsetY = (height - ih * scale) / 2;

        for (const item of data.detections || []) {
            const [x1, y1, x2, y2] = item.bbox;

            const x = offsetX + x1 * scale;
            const y = offsetY + y1 * scale;
            const w = (x2 - x1) * scale;
            const h = (y2 - y1) * scale;

            const color = "#FFD400";

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            const label =
                `${item.class_name} ${Number(item.confidence).toFixed(2)}`;

            ctx.font = "bold 14px Arial";

            const labelWidth = ctx.measureText(label).width + 18;
            const lx = Math.max(
                0,
                Math.min(x, width - labelWidth)
            );
            const ly = y >= 29 ? y - 29 : y;

            ctx.fillStyle = color;
            ctx.fillRect(lx, ly, labelWidth, 29);

            ctx.fillStyle = "#171717";
            ctx.fillText(label, lx + 9, ly + 20);
        }
    }

    function renderResults(data) {
        lastResult = data;
        drawBoxes(data);

        const detections = data.detections || [];

        $("objectCount").textContent =
            `${detections.length} objek`;

        if (!detections.length) {
            $("emptyResult").hidden = false;
            $("resultContent").hidden = true;

            $("emptyResult").querySelector("h3").textContent =
                "Pisang tidak terdeteksi";

            $("emptyResult").querySelector("p").textContent =
                "Coba perbaiki pencahayaan atau posisi pisang.";

            return;
        }

        $("emptyResult").hidden = true;
        $("resultContent").hidden = false;

        const best = detections.reduce((a, b) =>
            a.confidence >= b.confidence ? a : b
        );

        $("predictionLabel").textContent =
            `${best.label} (${best.class_name})`;

        $("predictionCaption").textContent = best.caption;

        $("confidenceValue").textContent =
            `${(best.confidence * 100).toFixed(1)}%`;

        $("confidenceBar").style.width =
            `${Math.min(best.confidence * 100, 100)}%`;

        const list = $("detectionList");
        list.replaceChildren();

        detections.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "detection-item";

            const title = document.createElement("strong");
            title.textContent =
                `${index + 1}. ${item.label} (${item.class_name}) · ` +
                `${(item.confidence * 100).toFixed(1)}%`;

            const caption = document.createElement("p");
            caption.textContent = item.caption;

            card.append(title, caption);
            list.appendChild(card);
        });
    }

    async function scan() {
        if (busy) return;

        busy = true;

        const token = generation;
        const currentMode = mode;
        const frameTime = video.currentTime;

        updateButtons();

        try {
            const blob = await captureFrame();
            const result = await predict(blob);

            if (token !== generation || currentMode !== mode) return;

            if (mode === "video") {
                if (
                    video.paused ||
                    video.seeking ||
                    Math.abs(video.currentTime - frameTime) > 0.7
                ) {
                    clearOverlay();
                    return;
                }
            }

            renderResults(result);
            setStatus("Deteksi berhasil");
        } catch (error) {
            if (token === generation) {
                stopLoop();
                setStatus("Deteksi gagal");
                alert(error.message);
            }
        } finally {
            busy = false;
            updateButtons();
        }
    }

    async function runLoop() {
        if (!active) return;

        if (mode === "video" && video.paused) {
            stopLoop();
            return;
        }

        await scan();

        if (active) {
            timer = setTimeout(runLoop, INTERVAL);
        }
    }

    function loadImage(file) {
        if (!file) return;

        if (
            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
            file.size > 8 * 1024 * 1024
        ) {
            alert("Gunakan JPG, PNG, atau WEBP maksimal 8 MB.");
            return;
        }

        stopLoop();
        clearFiles();
        resetResults();

        imageFile = file;
        mediaUrl = URL.createObjectURL(file);

        image.onload = () => {
            image.hidden = false;
            $("mediaPlaceholder").hidden = true;
            setStatus("Gambar siap dideteksi");
            updateButtons();
        };

        image.onerror = () => {
            clearFiles();
            alert("Gambar tidak dapat dibuka.");
        };

        image.src = mediaUrl;
    }

    function loadVideo(file) {
        if (!file) return;

        if (
            !["video/mp4", "video/webm"].includes(file.type) ||
            file.size > MAX_VIDEO_SIZE
        ) {
            alert("Gunakan MP4 atau WEBM maksimal 100 MB.");
            return;
        }

        stopLoop();
        clearFiles();
        resetResults();

        mediaUrl = URL.createObjectURL(file);

        video.onloadedmetadata = () => {
            videoReady = true;
            video.hidden = false;
            $("mediaPlaceholder").hidden = true;
            setStatus("Video siap dianalisis");
            updateButtons();
        };

        video.onerror = () => {
            clearFiles();
            alert("Video tidak dapat dibuka.");
        };

        video.src = mediaUrl;
        video.load();
    }

    async function startVideoAnalysis() {
        if (mode !== "video" || !videoReady) return;

        try {
            stopLoop();
            resetResults();

            if (video.ended) video.currentTime = 0;

            await video.play();

            if (mode === "video" && !video.paused) {
                startLoop();
            }
        } catch (error) {
            alert(error.message);
        }
    }

    document.querySelectorAll(".mode").forEach(button => {
        button.addEventListener("click", () => {
            switchMode(button.dataset.mode);
        });
    });

    $("startCamera").addEventListener("click", startCamera);

    $("stopCamera").addEventListener("click", () => {
        stopCamera();
        resetResults();
        $("mediaPlaceholder").hidden = false;
        setStatus("Kamera dimatikan");
    });

    $("toggleDetection").addEventListener("click", () => {
        if (active) {
            stopLoop();
            clearOverlay();
            setStatus("Deteksi dijeda");
        } else {
            startLoop();
        }
    });

    $("imageUpload").addEventListener("change", event => {
        loadImage(event.target.files?.[0]);
        event.target.value = "";
    });

    $("videoUpload").addEventListener("change", event => {
        loadVideo(event.target.files?.[0]);
        event.target.value = "";
    });

    $("scanImage").addEventListener("click", scan);

    $("analyzeVideo").addEventListener(
        "click",
        startVideoAnalysis
    );

    video.addEventListener("pause", () => {
        if (mode === "video") {
            stopLoop();
            clearOverlay();
        }
    });

    video.addEventListener("seeking", () => {
        if (mode === "video") {
            stopLoop();
            resetResults();
        }
    });

    video.addEventListener("ended", () => {
        stopLoop();
        setStatus("Video selesai");
    });

    window.addEventListener("resize", () => {
        if (lastResult) drawBoxes(lastResult);
    });

    window.addEventListener("pagehide", () => {
        stopCamera();
        clearFiles();
    });

    switchMode("webcam");
});

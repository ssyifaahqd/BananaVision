
document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);

    // ========================================================
    // 1. ELEMEN HALAMAN
    // ========================================================

    const webcam = $("webcam");
    const image = $("imagePreview");
    const video = $("videoPreview");
    const canvas = $("overlay");
    const stage = $("mediaStage");

    if (!webcam || !image || !video || !canvas || !stage) {
        console.error("Elemen halaman deteksi tidak lengkap.");
        return;
    }

    const ctx = canvas.getContext("2d");

    const capture = document.createElement("canvas");
    const captureCtx = capture.getContext("2d");

    const INTERVAL = 400;
    const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

    let mode = "webcam";
    let stream = null;
    let mediaUrl = null;
    let imageFile = null;
    let videoReady = false;

    let active = false;
    let busy = false;
    let timer = null;
    let generation = 0;
    let lastResult = null;

    // ========================================================
    // 2. STATUS DAN TOMBOL
    // ========================================================

    function setStatus(message) {
        $("statusText").textContent = message;
    }

    function setLive(value) {
        $("liveStatus").textContent = value ? "Live" : "Offline";
        $("liveDot").classList.toggle("active", value);
    }

    function updateButtons() {
        $("startCamera").disabled = !!stream;
        $("stopCamera").disabled = !stream;
        $("toggleDetection").disabled = !stream;

        $("scanImage").disabled = !imageFile || busy;
        $("analyzeVideo").disabled = !videoReady;
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

    // ========================================================
    // 3. HENTIKAN PROSES
    // ========================================================

    function stopLoop() {
        active = false;
        generation++;

        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }

        setLive(false);
        $("toggleDetection").textContent = "Deteksi Otomatis";
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

    // ========================================================
    // 4. PILIH MODE
    // ========================================================

    function switchMode(next) {
        if (!["webcam", "image", "video"].includes(next)) {
            return;
        }

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

    // ========================================================
    // 5. LIVE WEBCAM
    // ========================================================

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

            const newStream =
                await navigator.mediaDevices.getUserMedia({
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

    // ========================================================
    // 6. LOOP DETEKSI
    // ========================================================

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

    // ========================================================
    // 7. AMBIL FRAME
    // ========================================================

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

            capture.width = Math.max(
                1,
                Math.round(width * scale)
            );

            capture.height = Math.max(
                1,
                Math.round(height * scale)
            );

            captureCtx.drawImage(
                source,
                0,
                0,
                capture.width,
                capture.height
            );

            capture.toBlob(
                blob => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(
                            new Error("Gagal mengambil frame.")
                        );
                    }
                },
                "image/jpeg",
                0.85
            );
        });
    }

    // ========================================================
    // 8. KIRIM FRAME KE LARAVEL
    // ========================================================

    async function predictFrame(blob) {
        if (!window.BANANA?.endpoint) {
            throw new Error(
                "Endpoint Laravel belum dikonfigurasi."
            );
        }

        const form = new FormData();

        form.append(
            "image",
            blob,
            "frame.jpg"
        );

        const response = await fetch(
            window.BANANA.endpoint,
            {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN": window.BANANA.csrf,
                    "Accept": "application/json"
                },
                body: form
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.errors?.image?.[0] ||
                data.detail ||
                data.message ||
                `Deteksi gagal (HTTP ${response.status}).`
            );
        }

        return data;
    }

    // ========================================================
    // 9. GAMBAR BOUNDING BOX
    // ========================================================

    function drawBoxes(data) {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const iw = Number(data.image_width);
        const ih = Number(data.image_height);

        if (!iw || !ih) return;

        const source = sourceElement();

        // Cocokkan koordinat dengan object-fit media.
        const style = window.getComputedStyle(source);
        const fit = style.objectFit || "contain";

        const mediaWidth = source.clientWidth || width;
        const mediaHeight = source.clientHeight || height;

        const mediaX = source.offsetLeft || 0;
        const mediaY = source.offsetTop || 0;

        let scaleX;
        let scaleY;
        let offsetX;
        let offsetY;

        if (fit === "fill") {
            scaleX = mediaWidth / iw;
            scaleY = mediaHeight / ih;
            offsetX = mediaX;
            offsetY = mediaY;
        } else {
            const scale = fit === "cover"
                ? Math.max(mediaWidth / iw, mediaHeight / ih)
                : Math.min(mediaWidth / iw, mediaHeight / ih);

            scaleX = scale;
            scaleY = scale;

            offsetX = mediaX + (mediaWidth - iw * scale) / 2;
            offsetY = mediaY + (mediaHeight - ih * scale) / 2;
        }

        for (const item of data.detections || []) {
            if (!Array.isArray(item.bbox) ||
                item.bbox.length !== 4) {
                continue;
            }

            const [x1, y1, x2, y2] = item.bbox;

            const x = offsetX + x1 * scaleX;
            const y = offsetY + y1 * scaleY;

            const w = (x2 - x1) * scaleX;
            const h = (y2 - y1) * scaleY;

            const colors = {
                Unripe: "#48B96A",
                Ripe: "#FFD400",
                Overripe: "#D97745"
            };

            const color =
                colors[item.class_name] || "#FFD400";

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);

            const label =
                `${item.label || item.class_name} ` +
                `${(Number(item.confidence) * 100).toFixed(1)}%`;

            ctx.font = "bold 14px Arial";

            const labelWidth =
                ctx.measureText(label).width + 18;

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

    // ========================================================
    // 10. TAMPILKAN HASIL
    // ========================================================

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

        $("predictionCaption").textContent =
            best.caption || data.caption || "";

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
                `${index + 1}. ${item.label} ` +
                `(${item.class_name}) · ` +
                `${(item.confidence * 100).toFixed(1)}%`;

            const description = document.createElement("p");
            description.textContent = item.caption || "";

            card.append(title, description);
            list.appendChild(card);
        });
    }

    // ========================================================
    // 11. JALANKAN DETEKSI
    // ========================================================

    async function scan() {
        if (busy) return;

        busy = true;

        const token = generation;
        const currentMode = mode;
        const frameTime = video.currentTime;

        updateButtons();

        try {
            const blob = await captureFrame();
            const result = await predictFrame(blob);

            // Abaikan respons dari mode yang sudah ditutup.
            if (
                token !== generation ||
                currentMode !== mode
            ) {
                return;
            }

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
            console.error("BananaVision:", error);

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

    // ========================================================
    // 12. UPLOAD GAMBAR
    // ========================================================

    function loadImage(file) {
        if (!file) return;

        if (
            !["image/jpeg", "image/png", "image/webp"]
                .includes(file.type) ||
            file.size > MAX_IMAGE_SIZE
        ) {
            alert(
                "Gunakan JPG, PNG, atau WEBP maksimal 8 MB."
            );
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

    // ========================================================
    // 13. UPLOAD VIDEO
    // ========================================================

    function loadVideo(file) {
        if (!file) return;

        if (
            !["video/mp4", "video/webm"]
                .includes(file.type) ||
            file.size > MAX_VIDEO_SIZE
        ) {
            alert(
                "Gunakan MP4 atau WEBM maksimal 100 MB."
            );
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

            if (video.ended) {
                video.currentTime = 0;
            }

            await video.play();

            if (mode === "video" && !video.paused) {
                startLoop();
            }

        } catch (error) {
            alert(error.message);
        }
    }

    // ========================================================
    // 14. EVENT TOMBOL DAN MODE
    // ========================================================

    document.querySelectorAll(".mode").forEach(button => {
        button.addEventListener("click", () => {
            switchMode(button.dataset.mode);
        });
    });

    $("startCamera").addEventListener(
        "click",
        startCamera
    );

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

    $("scanImage").addEventListener(
        "click",
        scan
    );

    $("analyzeVideo").addEventListener(
        "click",
        startVideoAnalysis
    );

    // ========================================================
    // 15. EVENT VIDEO
    // ========================================================

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

    // ========================================================
    // 16. RESIZE DAN CLEANUP
    // ========================================================

    window.addEventListener("resize", () => {
        if (lastResult) {
            drawBoxes(lastResult);
        }
    });

    window.addEventListener("pagehide", () => {
        stopCamera();
        clearFiles();
    });

    // ========================================================
    // 17. INISIALISASI
    // ========================================================

    switchMode("webcam");
});

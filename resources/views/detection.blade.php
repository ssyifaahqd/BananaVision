
@extends('layouts.app')

@section('title', 'Deteksi | BananaVision')

@section('content')
<section class="detection-page">
    <div class="page-heading">
        <span class="section-kicker">AI-POWERED DETECTION</span>
        <h1>Deteksi Kematangan Pisang</h1>
        <p>
            Gunakan webcam, unggah gambar, atau video untuk
            mengetahui tingkat kematangan pisang.
        </p>
    </div>

    <div class="mode-switch" role="group" aria-label="Mode deteksi">
        <button type="button" class="mode active" data-mode="webcam"
                aria-pressed="true">
            <span class="mode-icon">◉</span> Webcam
        </button>
        <button type="button" class="mode" data-mode="image"
                aria-pressed="false">
            <span class="mode-icon">▧</span> Gambar
        </button>
        <button type="button" class="mode" data-mode="video"
                aria-pressed="false">
            <span class="mode-icon">▷</span> Video
        </button>
    </div>

    <div class="detection-grid">
        <section class="panel detection-panel">
            <div class="panel-heading">
                <div class="heading-group">
                    <div class="heading-icon">◉</div>
                    <div>
                        <h2>Area Deteksi</h2>
                        <p id="statusText" role="status">Kamera belum aktif</p>
                    </div>
                </div>
                <span class="panel-tag">YOLO Detection</span>
            </div>

            <div class="media-stage" id="mediaStage">
                <video id="webcam" autoplay muted playsinline hidden></video>

                <img id="imagePreview"
                     alt="Gambar yang diunggah" hidden>

                <video id="videoPreview"
                       controls playsinline hidden></video>

                <canvas id="overlay" aria-hidden="true"></canvas>

                <div id="mediaPlaceholder" class="media-placeholder">
                    <div class="placeholder-icon">◎</div>
                    <h3>Siap mendeteksi pisang?</h3>
                    <p>Aktifkan kamera untuk memulai.</p>
                </div>
            </div>

            <div id="webcamControls" class="control-row">
                <button id="startCamera" type="button"
                        class="btn btn-primary">
                    <span>◉</span> Aktifkan Kamera
                </button>
                <button id="stopCamera" type="button"
                        class="btn btn-outline" disabled>
                    Matikan Kamera
                </button>
                <button id="toggleDetection" type="button"
                        class="btn btn-outline" disabled>
                    Deteksi Otomatis
                </button>
                <div class="live-indicator">
                    <span id="liveDot" class="live-dot"></span>
                    <span id="liveStatus">Offline</span>
                </div>
            </div>

            <div id="imageControls" class="control-row" hidden>
                <label for="imageUpload" class="btn btn-primary">
                    ▧ Pilih Gambar
                </label>
                <input id="imageUpload" type="file"
                       accept="image/jpeg,image/png,image/webp" hidden>
                <button id="scanImage" type="button"
                        class="btn btn-outline" disabled>
                    Deteksi Gambar
                </button>
            </div>

            <div id="videoControls" class="control-row" hidden>
                <label for="videoUpload" class="btn btn-primary">
                    ▷ Pilih Video
                </label>
                <input id="videoUpload" type="file"
                       accept="video/mp4,video/webm" hidden>
                <button id="analyzeVideo" type="button"
                        class="btn btn-outline" disabled>
                    Mulai Analisis
                </button>
            </div>

            <div class="stage-footer">
                <p id="helperText" class="helper-text">
                    Deteksi otomatis berjalan setelah kamera aktif.
                </p>
                <span class="privacy-note">Pemrosesan melalui server YOLO</span>
            </div>
        </section>

        <section class="panel result-panel">
            <div class="panel-heading">
                <div class="heading-group">
                    <div class="heading-icon">▥</div>
                    <div>
                        <h2>Hasil Analisis</h2>
                        <p>Hasil deteksi dan klasifikasi pisang.</p>
                    </div>
                </div>
                <span id="objectCount" class="object-count">0 objek</span>
            </div>

            <div id="emptyResult" class="empty-result">
                <div class="empty-icon">✦</div>
                <h3>Belum ada hasil analisis</h3>
                <p>
                    Aktifkan kamera atau unggah media
                    untuk melihat hasil deteksi.
                </p>
            </div>

            <div id="resultContent" hidden>
                <div class="prediction-card">
                    <div class="prediction-top">
                        <h4>Prediksi Utama</h4>
                        <span class="prediction-badge">AI Result</span>
                    </div>

                    <div class="prediction-main">
                        <div class="prediction-icon">🍌</div>
                        <div class="prediction-info">
                            <h3 id="predictionLabel">—</h3>
                            <p id="predictionCaption">—</p>
                        </div>
                        <div class="prediction-score">
                            <strong id="confidenceValue">—</strong>
                            <span>Confidence</span>
                        </div>
                    </div>

                    <div class="confidence-track">
                        <div id="confidenceBar"></div>
                    </div>
                </div>

                <div class="detected-section">
                    <div class="section-row">
                        <h3>Objek Terdeteksi</h3>
                        <span class="section-hint">Detail prediksi</span>
                    </div>
                    <div id="detectionList"></div>
                </div>
            </div>

            <div class="ripeness-section">
                <h3>Kelas Kematangan</h3>
                <div class="ripeness-list">
                    <div class="ripeness-item">
                        <i class="ripeness-dot green"></i>
                        <span>Mentah <small>(Unripe)</small></span>
                    </div>
                    <div class="ripeness-item">
                        <i class="ripeness-dot yellow"></i>
                        <span>Matang <small>(Ripe)</small></span>
                    </div>
                    <div class="ripeness-item">
                        <i class="ripeness-dot brown"></i>
                        <span>Terlalu Matang <small>(Overripe)</small></span>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <div class="detection-tips">
        <span>✦ Tips hasil terbaik</span>
        <p>
            Gunakan pencahayaan yang cukup, pastikan objek
            terlihat jelas, dan hindari gerakan kamera berlebihan.
        </p>
    </div>
</section>
@endsection

@push('scripts')
<script>
window.BANANA = {
    endpoint: @json(route('predict')),
    csrf: @json(csrf_token())
};
</script>
<script src="{{ asset('js/detection.js') }}"></script>
@endpush

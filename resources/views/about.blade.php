
@extends('layouts.app')

@section('title', 'Tentang | BananaVision')

@section('content')
<section class="about-page">
    <div class="about-intro">
        <span class="section-kicker">ABOUT BANANAVISION</span>
        <h1>Teknologi sederhana untuk memahami kematangan pisang.</h1>
        <p>
            BananaVision adalah aplikasi deteksi objek berbasis web
            yang memanfaatkan model YOLO untuk mengenali dan
            mengklasifikasikan tingkat kematangan buah pisang.
        </p>
        <a href="{{ route('detection') }}" class="btn btn-primary">
            Coba Deteksi <span>↗</span>
        </a>
    </div>

    <div class="about-content-grid">
        <article class="about-card">
            <div class="feature-icon">◎</div>
            <h2>Bagaimana cara kerjanya?</h2>
            <p>
                Pengguna memilih webcam, gambar, atau video.
                Frame kemudian dianalisis menggunakan model YOLO
                untuk menemukan objek pisang dan menentukan kelas
                kematangannya.
            </p>
        </article>

        <article class="about-card">
            <div class="feature-icon">▥</div>
            <h2>Apa yang ditampilkan?</h2>
            <p>
                Hasil analisis mencakup bounding box, label
                kematangan, confidence score, dan deskripsi
                singkat berdasarkan kelas yang diprediksi.
            </p>
        </article>
    </div>

    <div class="about-classification">
        <span class="section-kicker">OUR CLASSIFICATION</span>
        <h2>Kelas kematangan</h2>
        <div class="about-class-grid">
            <div class="about-class-item">
                <i class="ripeness-dot green"></i>
                <div>
                    <strong>Mentah (Unripe)</strong>
                    <p>Umumnya memiliki kulit kehijauan.</p>
                </div>
            </div>
            <div class="about-class-item">
                <i class="ripeness-dot yellow"></i>
                <div>
                    <strong>Matang (Ripe)</strong>
                    <p>Umumnya memiliki kulit kuning dan siap dikonsumsi.</p>
                </div>
            </div>
            <div class="about-class-item">
                <i class="ripeness-dot brown"></i>
                <div>
                    <strong>Terlalu Matang (Overripe)</strong>
                    <p>Umumnya memiliki lebih banyak bercak kecokelatan.</p>
                </div>
            </div>
        </div>
    </div>
</section>
@endsection

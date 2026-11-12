
@extends('layouts.app')

@section('title', 'Beranda | BananaVision')

@section('content')

<section class="home-page">

    {{-- ================================
         HERO SECTION
    ================================= --}}

    <div class="home-hero">

        <div class="hero-copy">

            <div class="eyebrow">
                <span class="eyebrow-dot"></span>
                SMART BANANA RIPENESS DETECTION
            </div>

            <h1>
                Kenali tingkat<br>
                kematangan pisang<br>
                <span>lebih mudah.</span>
            </h1>

            <p class="hero-description">
                Deteksi dan klasifikasikan kematangan pisang
                menggunakan teknologi YOLO. Cukup gunakan
                kamera, unggah gambar, atau pilih video
                untuk melihat hasil analisis.
            </p>

            <div class="hero-actions">

                <a href="{{ route('detection') }}"
                   class="btn btn-primary btn-lg">
                    Mulai Deteksi
                    <span aria-hidden="true">↗</span>
                </a>

                <a href="{{ route('about') }}"
                   class="btn btn-outline btn-lg">
                    Pelajari Lebih Lanjut
                </a>

            </div>

            <div class="hero-highlights">

                <span>
                    <i class="check-icon">✓</i>
                    3 kelas kematangan
                </span>

                <span>
                    <i class="check-icon">✓</i>
                    Bounding box
                </span>

                <span>
                    <i class="check-icon">✓</i>
                    Confidence score
                </span>

            </div>

        </div>

        {{-- GAMBAR PISANG TANPA BINGKAI KUNING --}}

        <div class="hero-visual">

            <div class="hero-image-wrap">

                <img
                    src="{{ asset('images/Banana.jpeg') }}"
                    alt="Buah pisang untuk deteksi kematangan"
                    class="hero-photo"
                >

            </div>

        </div>

    </div>


    {{-- ================================
         FITUR UTAMA
    ================================= --}}

    <section class="features-section">

        <div class="section-heading">

            <div>

                <span class="section-kicker">
                    FITUR UTAMA
                </span>

                <h2>
                    Satu platform, tiga cara deteksi.
                </h2>

            </div>

        </div>


        <div class="feature-grid">

            {{-- WEBCAM --}}

            <article class="feature-card">

                <div class="feature-icon">◉</div>

                <span class="feature-number">01</span>

                <h3>Live Webcam</h3>

                <p>
                    Gunakan kamera perangkat untuk mendeteksi
                    pisang secara langsung dengan bounding box
                    dan label kematangan.
                </p>

                <a href="{{ route('detection') }}">
                    Coba fitur <span>↗</span>
                </a>

            </article>


            {{-- GAMBAR --}}

            <article class="feature-card">

                <div class="feature-icon">▧</div>

                <span class="feature-number">02</span>

                <h3>Upload Gambar</h3>

                <p>
                    Unggah foto pisang dan lihat hasil
                    klasifikasi, tingkat confidence,
                    serta lokasi objek yang terdeteksi.
                </p>

                <a href="{{ route('detection') }}">
                    Coba fitur <span>↗</span>
                </a>

            </article>


            {{-- VIDEO --}}

            <article class="feature-card">

                <div class="feature-icon">▷</div>

                <span class="feature-number">03</span>

                <h3>Analisis Video</h3>

                <p>
                    Pilih video dari perangkat dan analisis
                    frame selama pemutaran untuk mengetahui
                    tingkat kematangan pisang.
                </p>

                <a href="{{ route('detection') }}">
                    Coba fitur <span>↗</span>
                </a>

            </article>

        </div>

    </section>


    {{-- ================================
         KLASIFIKASI KEMATANGAN
    ================================= --}}

    <section class="home-classes">

        <div>

            <span class="section-kicker">
                KLASIFIKASI
            </span>

            <h2>
                Tiga tingkat kematangan
            </h2>

            <p>
                Hasil prediksi dikelompokkan berdasarkan
                kelas yang dikenali model YOLO.
            </p>

        </div>


        <div class="class-cards">

            <div class="class-card">

                <span class="class-dot green"></span>

                <strong>Mentah</strong>

                <small>Unripe</small>

            </div>


            <div class="class-card">

                <span class="class-dot yellow"></span>

                <strong>Matang</strong>

                <small>Ripe</small>

            </div>


            <div class="class-card">

                <span class="class-dot brown"></span>

                <strong>Terlalu Matang</strong>

                <small>Overripe</small>

            </div>

        </div>

    </section>

</section>

@endsection

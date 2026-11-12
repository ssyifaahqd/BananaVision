
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

    <meta name="csrf-token"
          content="{{ csrf_token() }}">

    <meta name="theme-color" content="#fffdf8">

    <title>@yield('title', 'BananaVision')</title>

    <!-- FAVICON -->
    <link
        rel="icon"
        type="image/png"
        href="{{ asset('images/LogoPisang.png') }}"
    >

    <!-- FONTS -->
    <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
    >

    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <!-- CSS -->
    <link
        rel="stylesheet"
        href="{{ asset('css/banana.css') }}?v=6"
    >
</head>

<body>

<!-- NAVBAR -->
<header class="site-header">

    <div class="nav-container">

        <!-- BRAND -->
        <a
            href="{{ route('home') }}"
            class="brand"
            aria-label="BananaVision Beranda"
        >
            <span class="brand-logo-wrapper">
                <img
                    src="{{ asset('images/LogoPisang.png') }}"
                    alt="Logo BananaVision"
                    class="brand-logo"
                    width="68"
                    height="68"
                >
            </span>

            <span class="brand-name">
                Banana<span>Vision</span>
            </span>
        </a>

        <!-- NAVIGATION -->
        <nav
            class="nav-links"
            aria-label="Navigasi utama"
        >
            <a
                href="{{ route('home') }}"
                class="{{ request()->routeIs('home') ? 'active' : '' }}"
                @if(request()->routeIs('home'))
                    aria-current="page"
                @endif
            >
                Beranda
            </a>

            <a
                href="{{ route('detection') }}"
                class="{{ request()->routeIs('detection') ? 'active' : '' }}"
                @if(request()->routeIs('detection'))
                    aria-current="page"
                @endif
            >
                Deteksi
            </a>

            <a
                href="{{ route('about') }}"
                class="{{ request()->routeIs('about') ? 'active' : '' }}"
                @if(request()->routeIs('about'))
                    aria-current="page"
                @endif
            >
                Tentang
            </a>
        </nav>

        <!-- CTA -->
        <a
            href="{{ route('detection') }}"
            class="nav-cta"
        >
            Mulai Deteksi
            <span aria-hidden="true">↗</span>
        </a>

    </div>

</header>

<!-- MAIN -->
<main id="main-content">
    @yield('content')
</main>

<!-- FOOTER -->
<footer class="site-footer">

    <div class="footer-inner">

        <div class="footer-brand">
            <img
                src="{{ asset('images/LogoPisang.png') }}"
                alt=""
                class="footer-logo"
                width="40"
                height="40"
            >

            <strong>
                Banana<span>Vision</span>
            </strong>
        </div>

        <p>
            Deteksi kematangan pisang berbasis YOLO.
        </p>

        <span class="footer-copyright">
            © {{ date('Y') }} BananaVision
        </span>

    </div>

</footer>

@stack('scripts')

</body>
</html>

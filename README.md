# 🍌 BananaVision
### Sistem Deteksi Tingkat Kematangan Buah Pisang Menggunakan YOLO

BananaVision merupakan aplikasi berbasis website yang digunakan untuk mendeteksi buah pisang sekaligus mengklasifikasikan tingkat kematangannya menggunakan model **YOLO (You Only Look Once)**.

Aplikasi ini dibangun menggunakan **Laravel** sebagai frontend dan backend website, serta **FastAPI (Python)** untuk menjalankan model deteksi YOLO.

## 1. Fitur Aplikasi

BananaVision memiliki tiga fitur utama:

1. **Live Webcam** — mendeteksi pisang secara langsung melalui kamera perangkat.
2. **Upload Gambar** — mendeteksi tingkat kematangan pisang dari gambar JPG, PNG, atau WEBP.
3. **Upload Video** — mendeteksi tingkat kematangan pisang dari video MP4 atau WEBM dengan memproses frame video secara berkala.

Hasil deteksi meliputi:
- Bounding box pada objek pisang.
- Label kelas kematangan.
- Confidence score hasil prediksi.
- Caption hasil deteksi.
- Jumlah pisang yang terdeteksi.

### Kelas Kematangan Pisang

| Kelas YOLO | Keterangan |
|---|---|
| Unripe | Mentah |
| Ripe | Matang |
| Overripe | Terlalu matang |

---

## 2. Teknologi yang Digunakan

| Teknologi | Kegunaan |
|---|---|
| Laravel | Website dan pengelolaan request |
| PHP | Backend Laravel |
| Blade | Tampilan halaman website |
| JavaScript | Webcam, upload media, dan visualisasi deteksi |
| Python | Menjalankan model machine learning |
| FastAPI | API untuk menghubungkan Laravel dengan YOLO |
| Ultralytics YOLO | Deteksi dan klasifikasi kematangan pisang |
| OpenCV | Pemrosesan gambar |
| NumPy | Pengolahan data gambar |

## 3. Persiapan Sebelum Instalasi

Pastikan perangkat sudah memiliki software berikut:

- Git
- PHP yang kompatibel dengan versi Laravel project
- Composer
- Python yang kompatibel dengan dependensi YOLO
- Node.js dan npm
- Visual Studio Code (opsional)

**Catatan:** Panduan terminal di bawah menggunakan Windows PowerShell.

### Cek instalasi

Buka terminal, kemudian jalankan:

```bash
git --version
php -v
composer --version
python --version
node -v
npm -v
```

Jika semuanya menampilkan versi masing-masing, lanjutkan ke tahap berikutnya.

Jika salah satu perintah tidak dikenali, instal software tersebut terlebih dahulu dan pastikan PATH sudah dikonfigurasi.

---

## 4. Clone Repository GitHub

Buka terminal pada folder tempat project ingin disimpan.

Jalankan:

```bash
git clone https://github.com/ssyifaahqd/BananaVision.git
```

Masuk ke folder project:

```bash
cd BananaVision
```

Pastikan folder project berhasil diunduh.

---

## 5. Struktur Folder Project

Struktur utama BananaVision adalah sebagai berikut:

```text
BananaVision/
│
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       └── DetectionController.php
│   │
│   └── Services/
│       └── YoloService.php
│
├── bootstrap/
├── config/
│   └── services.php
│
├── public/
│   ├── css/
│   └── js/
│       └── detection.js
│
├── resources/
│   └── views/
│       ├── home.blade.php
│       ├── detection.blade.php
│       └── about.blade.php
│
├── routes/
│   └── web.php
│
├── Banana_Ripeness_Final/
│   ├── api.py
│   ├── detect.py
│   ├── best.pt
│   ├── yolov8n.pt
│   ├── requirements.txt
│   └── venv/
│
├── .env
├── artisan
├── composer.json
├── package.json
└── README.md
```

**Perhatian:** File `.env`, `venv`, dan model `.pt` mungkin tidak tersedia setelah clone karena dapat dikecualikan dari Git. Folder `venv` harus dibuat sendiri. File model perlu diperoleh dari anggota tim jika tidak disertakan dalam repository.

---

## 6. Instalasi Laravel

Pastikan terminal berada pada folder utama BananaVision.

### Langkah 1 — Install dependency PHP

```bash
composer install
```

Tunggu hingga proses selesai.

### Langkah 2 — Install dependency frontend

```bash
npm install
```

### Langkah 3 — Buat file environment Laravel

Pada Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Jika file `.env` sudah tersedia, langkah ini tidak perlu dilakukan.

### Langkah 4 — Generate application key

```bash
php artisan key:generate
```

### Langkah 5 — Konfigurasi koneksi FastAPI

Buka file `.env` dan tambahkan:

```env
YOLO_API_URL=http://127.0.0.1:8001
```

Kemudian buka `config/services.php` dan pastikan terdapat konfigurasi berikut di dalam array `return`:

```php
'yolo' => [
    'url' => env(
        'YOLO_API_URL',
        'http://127.0.0.1:8001'
    ),
],
```

Konfigurasi ini digunakan oleh Laravel untuk menghubungi FastAPI.

### Langkah 6 — Bersihkan cache Laravel

```bash
php artisan optimize:clear
```

### Langkah 7 — Build frontend

Jika project menggunakan Vite, jalankan:

```bash
npm run build
```

Untuk development, `npm run dev` juga dapat digunakan, tetapi harus dijalankan pada terminal tersendiri.

**Database:** Jika konfigurasi project menggunakan database, siapkan database dan jalankan migrasi sesuai kebutuhan. Jangan langsung menjalankan migrasi tanpa memastikan konfigurasi database pada `.env` sudah benar. Untuk Laravel yang menggunakan SQLite, pastikan file database tersedia jika diperlukan.

---

## 7. Instalasi Python dan YOLO

Buka terminal baru.

Masuk ke folder model:

```bash
cd Banana_Ripeness_Final
```

Jika terminal sudah berada di folder utama project, perintah tersebut dapat langsung digunakan.

### Langkah 1 — Buat virtual environment

```bash
python -m venv venv
```

Virtual environment digunakan agar library Python project tidak bercampur dengan instalasi Python lainnya.

### Langkah 2 — Aktifkan virtual environment

Pada Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Jika berhasil, terminal akan menampilkan `(venv)`.

Jika PowerShell memblokir aktivasi, jalankan:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Kemudian ulangi aktivasi.

### Langkah 3 — Upgrade pip

```bash
python -m pip install --upgrade pip
```

### Langkah 4 — Install library Python

Jika `requirements.txt` sudah tersedia dan sesuai dengan API:

```bash
python -m pip install -r requirements.txt
```

Pastikan library berikut tersedia:

```bash
python -m pip install fastapi uvicorn python-multipart ultralytics opencv-python numpy
```

Perintah kedua digunakan untuk melengkapi dependency jika belum tersedia.

### Langkah 5 — Periksa instalasi library

```bash
python -c "import cv2, numpy, fastapi, ultralytics, uvicorn; print('Library berhasil dimuat')"
```

Jika muncul:

```text
Library berhasil dimuat
```

berarti dependency utama API sudah dapat diimpor.

---

## 8. Menyiapkan Model YOLO

Pastikan folder `Banana_Ripeness_Final` memiliki:

```text
Banana_Ripeness_Final/
├── api.py
├── detect.py
├── best.pt
└── yolov8n.pt
```

Keterangan:

- `best.pt`: model YOLO hasil training untuk mendeteksi tingkat kematangan pisang.
- `yolov8n.pt`: model COCO yang digunakan sebagai filter tambahan.
- `detect.py`: fungsi inference dan pemrosesan hasil deteksi.
- `api.py`: endpoint FastAPI yang diakses Laravel.

Jika `best.pt` tidak tersedia di GitHub, minta file tersebut kepada anggota tim, lalu letakkan pada folder yang sama dengan `api.py`.

**Jangan mengganti `best.pt` dengan model YOLO umum**, karena model tersebut belum tentu memiliki kelas Unripe, Ripe, dan Overripe.

---

## 9. Menjalankan FastAPI

Pastikan terminal berada di:

```text
BananaVision/Banana_Ripeness_Final
```

dan virtual environment sudah aktif.

Jalankan:

```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

Jika berhasil, terminal akan menampilkan pesan seperti:

```text
Uvicorn running on http://127.0.0.1:8001
```

### Memeriksa API

Buka browser:

```text
http://127.0.0.1:8001/health
```

Jika model berhasil dimuat, respons akan menampilkan:

```json
{
  "status": "ok",
  "model_loaded": true,
  "coco_loaded": true,
  "classes": {
    "0": "Overripe",
    "1": "Ripe",
    "2": "Unripe"
  }
}
```

Urutan kelas mengikuti model `best.pt` yang digunakan.

Untuk menguji upload gambar langsung melalui FastAPI, buka:

```text
http://127.0.0.1:8001/docs
```

Pilih endpoint `POST /predict`, klik **Try it out**, unggah gambar, lalu klik **Execute**.

Jika berhasil, API akan mengembalikan hasil deteksi dalam format JSON.

**Jangan tutup terminal FastAPI selama menggunakan website.**

---

## 10. Menjalankan Laravel

Buka **terminal baru** tanpa menghentikan FastAPI.

Masuk ke folder utama BananaVision.

Jalankan:

```bash
php artisan serve
```

Jika berhasil, akan muncul alamat:

```text
http://127.0.0.1:8000
```

Buka alamat tersebut melalui browser.

Halaman deteksi dapat diakses melalui:

```text
http://127.0.0.1:8000/detection
```

### Penting: Dua server harus berjalan bersamaan

**Terminal 1 — FastAPI**

```bash
python -m uvicorn api:app --host 127.0.0.1 --port 8001
```

**Terminal 2 — Laravel**

```bash
php artisan serve
```

Laravel berjalan di port `8000`, sedangkan FastAPI berjalan di port `8001`.

---

## 11. Cara Menggunakan BananaVision

### A. Live Webcam

1. Buka halaman Detection.
2. Pilih mode **Webcam**.
3. Klik tombol untuk mengaktifkan kamera.
4. Izinkan browser mengakses webcam.
5. Arahkan kamera ke buah pisang.
6. Sistem akan mengirim frame kamera ke YOLO secara berkala.
7. Hasil deteksi ditampilkan melalui bounding box, label, confidence, dan caption.

Gunakan tombol jeda atau berhenti untuk menghentikan deteksi.

### B. Upload Gambar

1. Pilih mode **Image**.
2. Upload gambar pisang.
3. Gunakan format JPG, PNG, atau WEBP.
4. Ukuran gambar maksimal 8 MB.
5. Klik tombol untuk menjalankan deteksi.
6. Sistem akan menampilkan hasil klasifikasi kematangan pisang.

### C. Upload Video

1. Pilih mode **Video**.
2. Upload video berformat MP4 atau WEBM.
3. Ukuran video maksimal 100 MB.
4. Klik tombol untuk memulai analisis.
5. Video akan diputar dan frame dikirim ke model YOLO secara berkala.
6. Hasil deteksi akan ditampilkan di atas video.

**Catatan:** Video diproses per frame melalui browser. Sistem tidak otomatis menghasilkan file video baru yang sudah memiliki bounding box.

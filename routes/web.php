
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DetectionController;

/*
|--------------------------------------------------------------------------
| Web Routes - BananaVision
|--------------------------------------------------------------------------
*/

// Halaman Beranda
Route::view('/', 'home')
    ->name('home');

// Halaman Deteksi
Route::view('/detection', 'detection')
    ->name('detection');

// Halaman Tentang
Route::view('/about', 'about')
    ->name('about');

// Endpoint prediksi YOLO
Route::post('/predict', [
    DetectionController::class,
    'predict'
])->name('predict');

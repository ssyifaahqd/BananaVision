
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DetectionController;

// Halaman Beranda
Route::view('/', 'home')->name('home');

// Halaman Deteksi
Route::view('/detection', 'detection')
    ->name('detection');

// Halaman Tentang
Route::view('/about', 'about')
    ->name('about');

// Endpoint deteksi sementara untuk UI/UX
Route::post('/predict', function () {
    return response()->json([
        'message' => 'Model YOLO belum diintegrasikan.',
        'detections' => [],
        'demo' => true,
    ], 503);
})->name('predict');

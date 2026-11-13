<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class YoloService
{
    public function predict(string $imagePath): array
    {
        if (! is_file($imagePath)) {
            throw new RuntimeException(
                'File gambar tidak ditemukan.'
            );
        }

        $url = rtrim(
            config('services.yolo.url', 'http://127.0.0.1:8001'),
            '/'
        );

        $handle = fopen($imagePath, 'rb');

        if ($handle === false) {
            throw new RuntimeException(
                'Gagal membuka gambar.'
            );
        }

        try {
            $response = Http::timeout(120)
                ->connectTimeout(10)
                ->acceptJson()
                ->asMultipart()
                ->attach(
                    'image',
                    $handle,
                    basename($imagePath)
                )
                ->post($url . '/predict');

            if ($response->failed()) {
                Log::error('YOLO API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                throw new RuntimeException(
                    'YOLO API HTTP ' .
                    $response->status() .
                    ': ' .
                    $response->body()
                );
            }

            $data = $response->json();

            if (! is_array($data)) {
                throw new RuntimeException(
                    'Respons API YOLO tidak valid.'
                );
            }

            return $data;

        } finally {
            fclose($handle);
        }
    }
}

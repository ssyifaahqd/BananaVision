<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class YoloService
{
    public function predict(string $imagePath): array
    {
        $file = fopen($imagePath, 'rb');

        if ($file === false) {
            throw new \RuntimeException(
                'Gagal membuka gambar.'
            );
        }

        try {
            $response = Http::connectTimeout(5)
                ->timeout(30)
                ->attach('file', $file, 'frame.jpg')
                ->post(
                    rtrim(
                        config('services.yolo.url'),
                        '/'
                    ) . '/predict'
                );

            $response->throw();

            $data = $response->json();

            if (!is_array($data) ||
                !isset($data['detections'])) {
                throw new \RuntimeException(
                    'Respons YOLO tidak valid.'
                );
            }

            return $data;

        } finally {
            fclose($file);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\YoloService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DetectionController extends Controller
{
    public function predict(Request $request, YoloService $yolo)
    {
        $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:8192',
            ],
        ]);

        try {
            $image = $request->file('image');

            if (! $image || ! $image->isValid()) {
                throw new \RuntimeException('Uploaded image is invalid.');
            }

            $result = $yolo->predict($image->getRealPath());

            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('YOLO inference failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Model YOLO gagal memproses gambar.',
            ], 502);
        }
    }
}

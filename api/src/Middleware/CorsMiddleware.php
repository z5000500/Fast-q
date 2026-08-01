<?php

declare(strict_types=1);

namespace App\Middleware;

class CorsMiddleware
{
    public static function handle(): void
    {
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Comma-separated list of allowed origins, e.g. "https://fastq.vercel.app,http://localhost:8080"
        $allowedOrigins = array_filter(array_map(
            'trim',
            explode(',', $_ENV['FRONTEND_URL'] ?? 'http://localhost:8080')
        ));

        if (in_array($requestOrigin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$requestOrigin}");
            header('Vary: Origin');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}

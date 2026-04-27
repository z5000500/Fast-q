<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Helpers\JWT;
use App\Helpers\Response;

class AuthMiddleware
{
    /**
     * Verify the Bearer token and return decoded payload.
     * Calls Response::unauthorized() (which exits) on failure.
     */
    public static function authenticate(): object
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            Response::unauthorized('Missing or malformed Authorization header');
        }

        $decoded = JWT::decode($matches[1]);

        if ($decoded === null) {
            Response::unauthorized('Invalid or expired token');
        }

        return $decoded;
    }

    /**
     * Try to authenticate but don't fail -- returns null when no valid token present.
     */
    public static function optionalAuth(): ?object
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return null;
        }

        return JWT::decode($matches[1]);
    }
}

<?php

declare(strict_types=1);

namespace App\Helpers;

use Firebase\JWT\JWT as FirebaseJWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

class JWT
{
    private static function secret(): string
    {
        return $_ENV['JWT_SECRET'] ?? 'change-me-in-production';
    }

    public static function createAccessToken(array $user): string
    {
        $now = time();
        $payload = [
            'iss' => 'quizcraft-api',
            'sub' => $user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'],
            'iat' => $now,
            'exp' => $now + (int)($_ENV['JWT_ACCESS_LIFETIME'] ?? 900), // 15 min
        ];

        return FirebaseJWT::encode($payload, self::secret(), 'HS256');
    }

    public static function createRefreshToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    public static function decode(string $token): ?object
    {
        try {
            return FirebaseJWT::decode($token, new Key(self::secret(), 'HS256'));
        } catch (ExpiredException) {
            return null;
        } catch (\Exception) {
            return null;
        }
    }

    public static function hashRefreshToken(string $token): string
    {
        return hash('sha256', $token);
    }
}

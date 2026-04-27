<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\JWT;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Models\User;

class AuthController
{
    private User $userModel;

    public function __construct()
    {
        $this->userModel = new User();
    }

    public function register(array $body): void
    {
        $v = Validator::make($body)
            ->required('email', 'Email')
            ->email('email')
            ->required('password', 'Password')
            ->minLength('password', 6, 'Password')
            ->required('display_name', 'Display name');

        if ($v->fails()) {
            Response::error('Validation failed', 422, $v->errors());
        }

        if ($this->userModel->findByEmail($body['email'])) {
            Response::error('Email already registered', 409);
        }

        $hash = password_hash($body['password'], PASSWORD_BCRYPT);
        $user = $this->userModel->create($body['email'], $body['display_name'], $hash);

        $tokens = $this->issueTokens($user);

        Response::success([
            'user'          => $user,
            'access_token'  => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ], 201);
    }

    public function login(array $body): void
    {
        $v = Validator::make($body)
            ->required('email', 'Email')
            ->required('password', 'Password');

        if ($v->fails()) {
            Response::error('Validation failed', 422, $v->errors());
        }

        $user = $this->userModel->findByEmail($body['email']);

        if (!$user || !password_verify($body['password'], $user['password_hash'])) {
            Response::error('Invalid email or password', 401);
        }

        unset($user['password_hash']);
        $tokens = $this->issueTokens($user);

        Response::success([
            'user'          => $user,
            'access_token'  => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ]);
    }

    public function refresh(array $body): void
    {
        $refreshToken = $body['refresh_token'] ?? '';
        if (empty($refreshToken)) {
            Response::error('Refresh token is required', 400);
        }

        $hash = JWT::hashRefreshToken($refreshToken);
        $stored = $this->userModel->findRefreshToken($hash);

        if (!$stored) {
            Response::unauthorized('Invalid or expired refresh token');
        }

        // Rotate: delete old token
        $this->userModel->deleteRefreshToken($hash);

        $user = $this->userModel->findById($stored['user_id']);
        if (!$user) {
            Response::unauthorized('User not found');
        }

        $tokens = $this->issueTokens($user);

        Response::success([
            'user'          => $user,
            'access_token'  => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ]);
    }

    public function logout(array $body): void
    {
        $refreshToken = $body['refresh_token'] ?? '';
        if (!empty($refreshToken)) {
            $this->userModel->deleteRefreshToken(JWT::hashRefreshToken($refreshToken));
        }

        Response::success(null);
    }

    public function me(): void
    {
        $auth = AuthMiddleware::authenticate();
        $user = $this->userModel->findById($auth->sub);

        if (!$user) {
            Response::notFound('User not found');
        }

        Response::success($user);
    }

    // ── Private helpers ──────────────────────────────────────

    private function issueTokens(array $user): array
    {
        $accessToken  = JWT::createAccessToken($user);
        $refreshToken = JWT::createRefreshToken();
        $refreshHash  = JWT::hashRefreshToken($refreshToken);

        $lifetime = (int)($_ENV['JWT_REFRESH_LIFETIME'] ?? 604800); // 7 days
        $this->userModel->storeRefreshToken($user['id'], $refreshHash, time() + $lifetime);

        return [
            'access_token'  => $accessToken,
            'refresh_token' => $refreshToken,
        ];
    }
}

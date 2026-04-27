<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;
use Ramsey\Uuid\Uuid;

class User
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(string $email, string $displayName, string $passwordHash): array
    {
        $id = Uuid::uuid4()->toString();
        $stmt = $this->db->prepare(
            'INSERT INTO users (id, email, display_name, password_hash) VALUES (:id, :email, :display_name, :password_hash)'
        );
        $stmt->execute([
            'id'            => $id,
            'email'         => $email,
            'display_name'  => $displayName,
            'password_hash' => $passwordHash,
        ]);

        return [
            'id'           => $id,
            'email'        => $email,
            'display_name' => $displayName,
            'avatar_url'   => null,
            'created_at'   => date('Y-m-d H:i:s'),
        ];
    }

    // ── Refresh token helpers ────────────────────────────────

    public function storeRefreshToken(string $userId, string $tokenHash, int $expiresAt): string
    {
        $id = Uuid::uuid4()->toString();
        $stmt = $this->db->prepare(
            'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (:id, :user_id, :token_hash, :expires_at)'
        );
        $stmt->execute([
            'id'         => $id,
            'user_id'    => $userId,
            'token_hash' => $tokenHash,
            'expires_at' => date('Y-m-d H:i:s', $expiresAt),
        ]);
        return $id;
    }

    public function findRefreshToken(string $tokenHash): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM refresh_tokens WHERE token_hash = :hash AND expires_at > NOW() LIMIT 1'
        );
        $stmt->execute(['hash' => $tokenHash]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function deleteRefreshToken(string $tokenHash): void
    {
        $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE token_hash = :hash');
        $stmt->execute(['hash' => $tokenHash]);
    }

    public function deleteAllRefreshTokens(string $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM refresh_tokens WHERE user_id = :user_id');
        $stmt->execute(['user_id' => $userId]);
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;
use Ramsey\Uuid\Uuid;

class Notification
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(array $data): array
    {
        $id = Uuid::uuid4()->toString();
        $stmt = $this->db->prepare(
            'INSERT INTO notifications (id, user_id, type, title, message, data)
             VALUES (:id, :uid, :type, :title, :message, :data)'
        );
        $stmt->execute([
            'id'      => $id,
            'uid'     => $data['user_id'],
            'type'    => $data['type'] ?? 'system',
            'title'   => $data['title'],
            'message' => $data['message'] ?? null,
            'data'    => $data['data'] ?? null,
        ]);

        return $this->findById($id);
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM notifications WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? $this->format($row) : null;
    }

    public function findByUser(string $userId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM notifications WHERE user_id = :uid ORDER BY created_at DESC LIMIT :lim'
        );
        $stmt->bindValue('uid', $userId);
        $stmt->bindValue('lim', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return array_map([$this, 'format'], $stmt->fetchAll());
    }

    public function markRead(string $id, string $userId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :uid'
        );
        $stmt->execute(['id' => $id, 'uid' => $userId]);
        return $stmt->rowCount() > 0;
    }

    public function unreadCount(string $userId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM notifications WHERE user_id = :uid AND is_read = 0'
        );
        $stmt->execute(['uid' => $userId]);
        return (int) $stmt->fetchColumn();
    }

    private function format(array $row): array
    {
        return [
            'id'        => $row['id'],
            'userId'    => $row['user_id'],
            'type'      => $row['type'],
            'title'     => $row['title'],
            'message'   => $row['message'],
            'data'      => $row['data'] ? json_decode($row['data'], true) : null,
            'isRead'    => (bool) $row['is_read'],
            'createdAt' => $row['created_at'],
        ];
    }
}

<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Models\Notification;

class NotificationController
{
    private Notification $model;

    public function __construct()
    {
        $this->model = new Notification();
    }

    public function list(): void
    {
        $auth = AuthMiddleware::authenticate();

        $notifications = $this->model->findByUser($auth->sub);
        $unreadCount   = $this->model->unreadCount($auth->sub);

        Response::success([
            'notifications' => $notifications,
            'unreadCount'   => $unreadCount,
        ]);
    }

    public function markRead(string $id): void
    {
        $auth = AuthMiddleware::authenticate();

        $updated = $this->model->markRead($id, $auth->sub);

        if (!$updated) {
            Response::notFound('Notification not found');
        }

        Response::success(null);
    }
}

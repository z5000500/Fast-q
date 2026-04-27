<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use App\Middleware\AuthMiddleware;
use App\Models\Quiz;
use App\Models\Attempt;

class StatsController
{
    public function global(): void
    {
        AuthMiddleware::authenticate();

        $quizModel    = new Quiz();
        $attemptModel = new Attempt();

        Response::success([
            'totalQuizzes'  => $quizModel->countAll(),
            'totalAttempts' => $attemptModel->countAll(),
        ]);
    }
}

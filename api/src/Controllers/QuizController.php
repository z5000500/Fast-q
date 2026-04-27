<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Models\Quiz;

class QuizController
{
    private Quiz $quizModel;

    public function __construct()
    {
        $this->quizModel = new Quiz();
    }

    public function list(): void
    {
        $auth = AuthMiddleware::authenticate();
        $quizzes = $this->quizModel->findByCreator($auth->sub);

        $result = [];
        foreach ($quizzes as $row) {
            $quiz = $this->quizModel->findWithQuestions($row['id']);
            if ($quiz) $result[] = $quiz;
        }

        Response::success($result);
    }

    public function create(array $body): void
    {
        $auth = AuthMiddleware::authenticate();

        $v = Validator::make($body)
            ->required('title', 'Title');

        if ($v->fails()) {
            Response::error('Validation failed', 422, $v->errors());
        }

        $quiz = $this->quizModel->create($body, $auth->sub);

        Response::success($quiz, 201);
    }

    public function get(string $id): void
    {
        $auth = AuthMiddleware::optionalAuth();
        $quiz = $this->quizModel->findWithQuestions($id);

        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        $isOwner = $auth && $auth->sub === $quiz['creatorId'];
        if (!$isOwner) {
            $quiz['questions'] = array_map(function ($q) {
                unset($q['correctAnswers']);
                return $q;
            }, $quiz['questions'] ?? []);
        }

        Response::success($quiz);
    }

    public function getByShareCode(string $code): void
    {
        $quiz = $this->quizModel->findWithQuestionsByShareCode($code);

        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        // Strip correct answers so participants cannot cheat
        $quiz['questions'] = array_map(function ($q) {
            unset($q['correctAnswers']);
            return $q;
        }, $quiz['questions'] ?? []);

        Response::success($quiz);
    }

    public function update(string $id, array $body): void
    {
        $auth = AuthMiddleware::authenticate();
        $existing = $this->quizModel->findById($id);

        if (!$existing) {
            Response::notFound('Quiz not found');
        }
        if ($existing['creator_id'] !== $auth->sub) {
            Response::forbidden('You can only edit your own quizzes');
        }

        $v = Validator::make($body)->required('title', 'Title');
        if ($v->fails()) {
            Response::error('Validation failed', 422, $v->errors());
        }

        $quiz = $this->quizModel->update($id, $body);

        Response::success($quiz);
    }

    public function delete(string $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $existing = $this->quizModel->findById($id);

        if (!$existing) {
            Response::notFound('Quiz not found');
        }
        if ($existing['creator_id'] !== $auth->sub) {
            Response::forbidden('You can only delete your own quizzes');
        }

        $this->quizModel->delete($id);

        Response::success(null);
    }

    public function duplicate(string $id): void
    {
        $auth = AuthMiddleware::authenticate();
        $source = $this->quizModel->findWithQuestions($id);

        if (!$source) {
            Response::notFound('Quiz not found');
        }

        $newData = [
            'title'       => $source['title'] . ' (Copy)',
            'description' => $source['description'],
            'status'      => 'draft',
            'settings'    => $source['settings'],
            'questions'   => array_map(function ($q) {
                // Strip IDs so new ones are generated
                unset($q['id']);
                $q['options'] = array_map(function ($o) {
                    unset($o['id']);
                    return $o;
                }, $q['options']);
                return $q;
            }, $source['questions']),
        ];

        $quiz = $this->quizModel->create($newData, $auth->sub);

        Response::success($quiz, 201);
    }
}

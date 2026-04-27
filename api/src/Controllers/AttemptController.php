<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\AuthMiddleware;
use App\Models\Attempt;
use App\Models\Quiz;
use App\Models\Notification;

class AttemptController
{
    private Attempt $attemptModel;

    public function __construct()
    {
        $this->attemptModel = new Attempt();
    }

    public function submit(string $quizId, array $body): void
    {
        $auth = AuthMiddleware::optionalAuth();

        $v = Validator::make($body)
            ->required('participantName', 'Participant name')
            ->required('answers', 'Answers')
            ->required('startedAt', 'Start time')
            ->required('completedAt', 'Completion time');

        if ($v->fails()) {
            Response::error('Validation failed', 422, $v->errors());
        }

        $quizModel = new Quiz();
        $quiz = $quizModel->findWithQuestions($quizId);
        if (!$quiz) {
            Response::notFound('Quiz not found');
        }

        if ($auth) {
            $body['participantId'] = $auth->sub;
        }

        $answersByQuestion = [];
        foreach ($body['answers'] ?? [] as $ans) {
            $answersByQuestion[$ans['questionId']] = $ans;
        }

        $gradedAnswers = [];
        $score = 0;
        $totalPoints = 0;
        $correctAnswersMap = [];

        foreach ($quiz['questions'] as $q) {
            $submitted = $answersByQuestion[$q['id']] ?? [];
            $selected = $submitted['selectedAnswers'] ?? [];
            $correct = $q['correctAnswers'] ?? [];

            $isCorrect = false;
            if ($q['type'] === 'fill_blank') {
                $isCorrect = strtolower(trim($selected[0] ?? '')) === strtolower(trim($correct[0] ?? ''));
            } else {
                $sortedSelected = $selected;
                $sortedCorrect = $correct;
                sort($sortedSelected);
                sort($sortedCorrect);
                $isCorrect = $sortedSelected === $sortedCorrect;
            }

            if ($isCorrect) {
                $score += $q['points'];
            }
            $totalPoints += $q['points'];

            $gradedAnswers[] = [
                'questionId'      => $q['id'],
                'selectedAnswers' => $selected,
                'isCorrect'       => $isCorrect,
                'timeTaken'       => $submitted['timeTaken'] ?? 0,
            ];

            $correctAnswersMap[$q['id']] = $correct;
        }

        $percentage = $totalPoints > 0 ? (int) round(($score / $totalPoints) * 100) : 0;

        $attemptData = [
            'participantId'   => $body['participantId'] ?? null,
            'participantName' => $body['participantName'],
            'score'           => $score,
            'totalPoints'     => $totalPoints,
            'percentage'      => $percentage,
            'startedAt'       => $body['startedAt'],
            'completedAt'     => $body['completedAt'],
            'timeTaken'       => $body['timeTaken'] ?? 0,
            'answers'         => $gradedAnswers,
        ];

        $attempt = $this->attemptModel->create($quizId, $attemptData);

        $attempt['correctAnswers'] = $correctAnswersMap;

        $creatorId = $this->attemptModel->getQuizCreatorId($quizId);
        if ($creatorId && $creatorId !== ($auth->sub ?? null)) {
            $notif = new Notification();
            $notif->create([
                'user_id' => $creatorId,
                'type'    => 'attempt_completed',
                'title'   => 'New quiz attempt',
                'message' => ($body['participantName'] ?? 'Someone') . ' completed your quiz with ' . $percentage . '%',
                'data'    => json_encode(['quiz_id' => $quizId, 'attempt_id' => $attempt['id']]),
            ]);
        }

        Response::success($attempt, 201);
    }

    public function listForQuiz(string $quizId): void
    {
        $auth = AuthMiddleware::authenticate();

        $creatorId = $this->attemptModel->getQuizCreatorId($quizId);
        if ($creatorId !== $auth->sub) {
            Response::forbidden('You can only view attempts for your own quizzes');
        }

        $attempts = $this->attemptModel->findByQuiz($quizId);
        Response::success($attempts);
    }

    public function stats(string $quizId): void
    {
        $auth = AuthMiddleware::authenticate();

        $creatorId = $this->attemptModel->getQuizCreatorId($quizId);
        if ($creatorId !== $auth->sub) {
            Response::forbidden('You can only view stats for your own quizzes');
        }

        $stats = $this->attemptModel->statsForQuiz($quizId);
        Response::success($stats);
    }

    public function leaderboard(string $quizId): void
    {
        $entries = $this->attemptModel->leaderboard($quizId);
        Response::success($entries);
    }

    public function myAttempts(): void
    {
        $auth = AuthMiddleware::authenticate();
        $attempts = $this->attemptModel->findByParticipant($auth->sub);
        Response::success($attempts);
    }
}

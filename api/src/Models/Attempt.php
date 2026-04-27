<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;
use Ramsey\Uuid\Uuid;

class Attempt
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function create(string $quizId, array $data): array
    {
        $id = Uuid::uuid4()->toString();

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO quiz_attempts (id, quiz_id, participant_id, participant_name, score, total_points, percentage, started_at, completed_at, time_taken)
                 VALUES (:id, :qid, :pid, :pname, :score, :total, :pct, :started, :completed, :time)'
            );
            $stmt->execute([
                'id'        => $id,
                'qid'       => $quizId,
                'pid'       => $data['participantId'] ?? null,
                'pname'     => $data['participantName'],
                'score'     => $data['score'],
                'total'     => $data['totalPoints'],
                'pct'       => $data['percentage'],
                'started'   => date('Y-m-d H:i:s', strtotime($data['startedAt'])),
                'completed' => date('Y-m-d H:i:s', strtotime($data['completedAt'])),
                'time'      => $data['timeTaken'],
            ]);

            $aStmt = $this->db->prepare(
                'INSERT INTO attempt_answers (id, attempt_id, question_id, selected_answers, is_correct, time_taken)
                 VALUES (:id, :aid, :qid, :selected, :correct, :time)'
            );

            foreach (($data['answers'] ?? []) as $ans) {
                $aStmt->execute([
                    'id'       => Uuid::uuid4()->toString(),
                    'aid'      => $id,
                    'qid'      => $ans['questionId'],
                    'selected' => json_encode($ans['selectedAnswers'] ?? []),
                    'correct'  => $ans['isCorrect'] ? 1 : 0,
                    'time'     => $ans['timeTaken'] ?? 0,
                ]);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->findById($id);
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM quiz_attempts WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        if (!$row) return null;

        return $this->formatAttempt($row);
    }

    public function findByQuiz(string $quizId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM quiz_attempts WHERE quiz_id = :qid ORDER BY completed_at DESC'
        );
        $stmt->execute(['qid' => $quizId]);
        return array_map([$this, 'formatAttempt'], $stmt->fetchAll());
    }

    public function findByParticipant(string $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM quiz_attempts WHERE participant_id = :pid ORDER BY completed_at DESC'
        );
        $stmt->execute(['pid' => $userId]);
        return array_map([$this, 'formatAttempt'], $stmt->fetchAll());
    }

    public function leaderboard(string $quizId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM quiz_attempts WHERE quiz_id = :qid ORDER BY percentage DESC, time_taken ASC'
        );
        $stmt->execute(['qid' => $quizId]);
        return array_map([$this, 'formatAttempt'], $stmt->fetchAll());
    }

    public function statsForQuiz(string $quizId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) as total_attempts,
                    ROUND(AVG(percentage)) as average_score,
                    MAX(percentage) as highest_score,
                    MIN(percentage) as lowest_score,
                    ROUND(AVG(time_taken)) as average_time
             FROM quiz_attempts WHERE quiz_id = :qid'
        );
        $stmt->execute(['qid' => $quizId]);
        $row = $stmt->fetch();

        if (!$row || (int)$row['total_attempts'] === 0) return null;

        return [
            'totalAttempts' => (int) $row['total_attempts'],
            'averageScore'  => (int) $row['average_score'],
            'highestScore'  => (int) $row['highest_score'],
            'lowestScore'   => (int) $row['lowest_score'],
            'averageTime'   => (int) $row['average_time'],
        ];
    }

    public function countAll(): int
    {
        return (int) $this->db->query('SELECT COUNT(*) FROM quiz_attempts')->fetchColumn();
    }

    /**
     * Get the quiz creator_id for a given quiz, used for notifications.
     */
    public function getQuizCreatorId(string $quizId): ?string
    {
        $stmt = $this->db->prepare('SELECT creator_id FROM quizzes WHERE id = :id');
        $stmt->execute(['id' => $quizId]);
        $val = $stmt->fetchColumn();
        return $val ?: null;
    }

    // ── Private ──────────────────────────────────────────────

    private function formatAttempt(array $row): array
    {
        $answers = $this->getAnswers($row['id']);

        return [
            'id'              => $row['id'],
            'quizId'          => $row['quiz_id'],
            'participantId'   => $row['participant_id'],
            'participantName' => $row['participant_name'],
            'score'           => (int) $row['score'],
            'totalPoints'     => (int) $row['total_points'],
            'percentage'      => (int) $row['percentage'],
            'answers'         => $answers,
            'startedAt'       => $row['started_at'],
            'completedAt'     => $row['completed_at'],
            'timeTaken'       => (int) $row['time_taken'],
        ];
    }

    private function getAnswers(string $attemptId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM attempt_answers WHERE attempt_id = :aid ORDER BY id'
        );
        $stmt->execute(['aid' => $attemptId]);

        return array_map(fn($r) => [
            'questionId'      => $r['question_id'],
            'selectedAnswers' => json_decode($r['selected_answers'], true) ?? [],
            'isCorrect'       => (bool) $r['is_correct'],
            'timeTaken'       => (int) $r['time_taken'],
        ], $stmt->fetchAll());
    }
}

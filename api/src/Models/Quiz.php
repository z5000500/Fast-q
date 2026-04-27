<?php

declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;
use Ramsey\Uuid\Uuid;

class Quiz
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }

    public function findByCreator(string $creatorId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM quizzes WHERE creator_id = :cid ORDER BY created_at DESC');
        $stmt->execute(['cid' => $creatorId]);
        return $stmt->fetchAll();
    }

    public function findById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM quizzes WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByShareCode(string $code): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM quizzes WHERE share_code = :code LIMIT 1');
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Load a quiz with its questions and options assembled into the nested shape
     * the frontend expects.
     */
    public function findWithQuestions(string $id): ?array
    {
        $quiz = $this->findById($id);
        if (!$quiz) return null;

        $quiz = $this->formatQuiz($quiz);
        $quiz['questions'] = $this->getQuestions($id);
        return $quiz;
    }

    public function findWithQuestionsByShareCode(string $code): ?array
    {
        $quiz = $this->findByShareCode($code);
        if (!$quiz) return null;

        $quiz = $this->formatQuiz($quiz);
        $quiz['questions'] = $this->getQuestions($quiz['id']);
        return $quiz;
    }

    public function create(array $data, string $creatorId): array
    {
        $id = $data['id'] ?? Uuid::uuid4()->toString();
        $shareCode = $data['share_code'] ?? $this->generateShareCode();

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO quizzes (id, title, description, creator_id, status, share_code, access_mode, timer_type, time_limit_seconds, shuffle_questions, show_results)
                 VALUES (:id, :title, :desc, :cid, :status, :code, :access, :timer, :limit, :shuffle, :show)'
            );
            $settings = $data['settings'] ?? [];
            $stmt->execute([
                'id'      => $id,
                'title'   => $data['title'],
                'desc'    => $data['description'] ?? '',
                'cid'     => $creatorId,
                'status'  => $data['status'] ?? 'draft',
                'code'    => $shareCode,
                'access'  => $settings['accessMode'] ?? 'public',
                'timer'   => $settings['timerType'] ?? 'none',
                'limit'   => $settings['timeLimitSeconds'] ?? 300,
                'shuffle' => ($settings['shuffleQuestions'] ?? false) ? 1 : 0,
                'show'    => ($settings['showResults'] ?? true) ? 1 : 0,
            ]);

            $this->saveQuestions($id, $data['questions'] ?? []);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->findWithQuestions($id);
    }

    public function update(string $id, array $data): array
    {
        $this->db->beginTransaction();
        try {
            $settings = $data['settings'] ?? [];
            $stmt = $this->db->prepare(
                'UPDATE quizzes SET title = :title, description = :desc, status = :status,
                        access_mode = :access, timer_type = :timer, time_limit_seconds = :limit,
                        shuffle_questions = :shuffle, show_results = :show
                 WHERE id = :id'
            );
            $stmt->execute([
                'id'      => $id,
                'title'   => $data['title'],
                'desc'    => $data['description'] ?? '',
                'status'  => $data['status'] ?? 'draft',
                'access'  => $settings['accessMode'] ?? 'public',
                'timer'   => $settings['timerType'] ?? 'none',
                'limit'   => $settings['timeLimitSeconds'] ?? 300,
                'shuffle' => ($settings['shuffleQuestions'] ?? false) ? 1 : 0,
                'show'    => ($settings['showResults'] ?? true) ? 1 : 0,
            ]);

            // Replace questions: delete old, insert new
            $this->db->prepare('DELETE FROM questions WHERE quiz_id = :qid')->execute(['qid' => $id]);
            $this->saveQuestions($id, $data['questions'] ?? []);

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        return $this->findWithQuestions($id);
    }

    public function delete(string $id): void
    {
        $this->db->prepare('DELETE FROM quizzes WHERE id = :id')->execute(['id' => $id]);
    }

    public function countAll(): int
    {
        return (int) $this->db->query('SELECT COUNT(*) FROM quizzes')->fetchColumn();
    }

    // ── Private helpers ──────────────────────────────────────

    private function saveQuestions(string $quizId, array $questions): void
    {
        $qStmt = $this->db->prepare(
            'INSERT INTO questions (id, quiz_id, type, text, correct_answers, blank_words, max_selections, question_order, points)
             VALUES (:id, :qid, :type, :text, :correct, :blank, :max, :ord, :pts)'
        );
        $oStmt = $this->db->prepare(
            'INSERT INTO question_options (id, question_id, text, option_order) VALUES (:id, :qid, :text, :ord)'
        );

        foreach ($questions as $i => $q) {
            $qId = $q['id'] ?? Uuid::uuid4()->toString();
            $qStmt->execute([
                'id'      => $qId,
                'qid'     => $quizId,
                'type'    => $q['type'],
                'text'    => $q['text'],
                'correct' => json_encode($q['correctAnswers'] ?? []),
                'blank'   => isset($q['blankWords']) ? json_encode($q['blankWords']) : null,
                'max'     => $q['maxSelections'] ?? null,
                'ord'     => $q['order'] ?? $i,
                'pts'     => $q['points'] ?? 1,
            ]);

            foreach (($q['options'] ?? []) as $j => $opt) {
                $oStmt->execute([
                    'id'   => $opt['id'] ?? Uuid::uuid4()->toString(),
                    'qid'  => $qId,
                    'text' => $opt['text'],
                    'ord'  => $j,
                ]);
            }
        }
    }

    private function getQuestions(string $quizId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM questions WHERE quiz_id = :qid ORDER BY question_order ASC'
        );
        $stmt->execute(['qid' => $quizId]);
        $rows = $stmt->fetchAll();

        $oStmt = $this->db->prepare(
            'SELECT * FROM question_options WHERE question_id = :qid ORDER BY option_order ASC'
        );

        $questions = [];
        foreach ($rows as $row) {
            $oStmt->execute(['qid' => $row['id']]);
            $options = $oStmt->fetchAll();

            $questions[] = [
                'id'             => $row['id'],
                'quizId'         => $row['quiz_id'],
                'type'           => $row['type'],
                'text'           => $row['text'],
                'options'        => array_map(fn($o) => [
                    'id'   => $o['id'],
                    'text' => $o['text'],
                ], $options),
                'correctAnswers' => json_decode($row['correct_answers'], true) ?? [],
                'blankWords'     => $row['blank_words'] ? json_decode($row['blank_words'], true) : null,
                'maxSelections'  => $row['max_selections'] ? (int) $row['max_selections'] : null,
                'order'          => (int) $row['question_order'],
                'points'         => (int) $row['points'],
            ];
        }

        return $questions;
    }

    /**
     * Convert DB row to frontend-compatible shape (camelCase, nested settings).
     */
    private function formatQuiz(array $row): array
    {
        // Get the creator display name
        $cStmt = $this->db->prepare('SELECT display_name FROM users WHERE id = :id');
        $cStmt->execute(['id' => $row['creator_id']]);
        $creatorName = $cStmt->fetchColumn() ?: 'Unknown';

        return [
            'id'          => $row['id'],
            'title'       => $row['title'],
            'description' => $row['description'] ?? '',
            'creatorId'   => $row['creator_id'],
            'creatorName' => $creatorName,
            'status'      => $row['status'],
            'shareCode'   => $row['share_code'],
            'settings'    => [
                'accessMode'       => $row['access_mode'],
                'timerType'        => $row['timer_type'],
                'timeLimitSeconds' => (int) $row['time_limit_seconds'],
                'shuffleQuestions' => (bool) $row['shuffle_questions'],
                'showResults'      => (bool) $row['show_results'],
            ],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }

    private function generateShareCode(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $code;
    }
}

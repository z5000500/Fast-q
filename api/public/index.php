<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Middleware\CorsMiddleware;
use App\Helpers\Response;
use App\Controllers\AuthController;
use App\Controllers\QuizController;
use App\Controllers\AttemptController;
use App\Controllers\StatsController;
use App\Controllers\NotificationController;

// Load .env from fast_q root (public/ -> api/ -> fast_q/)
$envPath = realpath(__DIR__ . '/../..');
if ($envPath && file_exists($envPath . '/.env')) {
    Dotenv::createImmutable($envPath)->load();
}

CorsMiddleware::handle();

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');

// Strip /api prefix if present
if (str_starts_with($uri, '/api')) {
    $uri = substr($uri, 4);
}

// Read JSON body once
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ── Auth routes ──────────────────────────────────────────────
if ($uri === '/auth/register' && $method === 'POST') {
    (new AuthController())->register($body);
}
if ($uri === '/auth/login' && $method === 'POST') {
    (new AuthController())->login($body);
}
if ($uri === '/auth/refresh' && $method === 'POST') {
    (new AuthController())->refresh($body);
}
if ($uri === '/auth/logout' && $method === 'POST') {
    (new AuthController())->logout($body);
}
if ($uri === '/auth/me' && $method === 'GET') {
    (new AuthController())->me();
}

// ── Quiz routes ──────────────────────────────────────────────
if (preg_match('#^/quizzes/join/([A-Za-z0-9]+)$#', $uri, $m) && $method === 'GET') {
    (new QuizController())->getByShareCode($m[1]);
}
if ($uri === '/quizzes' && $method === 'GET') {
    (new QuizController())->list();
}
if ($uri === '/quizzes' && $method === 'POST') {
    (new QuizController())->create($body);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})/duplicate$#', $uri, $m) && $method === 'POST') {
    (new QuizController())->duplicate($m[1]);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})/attempts$#', $uri, $m) && $method === 'POST') {
    (new AttemptController())->submit($m[1], $body);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})/attempts$#', $uri, $m) && $method === 'GET') {
    (new AttemptController())->listForQuiz($m[1]);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})/stats$#', $uri, $m) && $method === 'GET') {
    (new AttemptController())->stats($m[1]);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})/leaderboard$#', $uri, $m) && $method === 'GET') {
    (new AttemptController())->leaderboard($m[1]);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})$#', $uri, $m) && $method === 'GET') {
    (new QuizController())->get($m[1]);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})$#', $uri, $m) && $method === 'PUT') {
    (new QuizController())->update($m[1], $body);
}
if (preg_match('#^/quizzes/([a-f0-9\-]{36})$#', $uri, $m) && $method === 'DELETE') {
    (new QuizController())->delete($m[1]);
}

// ── Attempt routes ───────────────────────────────────────────
if ($uri === '/attempts/me' && $method === 'GET') {
    (new AttemptController())->myAttempts();
}

// ── Stats routes ─────────────────────────────────────────────
if ($uri === '/stats/global' && $method === 'GET') {
    (new StatsController())->global();
}

// ── Notification routes ──────────────────────────────────────
if ($uri === '/notifications' && $method === 'GET') {
    (new NotificationController())->list();
}
if (preg_match('#^/notifications/([a-f0-9\-]{36})/read$#', $uri, $m) && $method === 'PUT') {
    (new NotificationController())->markRead($m[1]);
}

// ── Fallback ─────────────────────────────────────────────────
Response::notFound('Endpoint not found');

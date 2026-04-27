require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { registerQuizSessionHandlers } = require('./socket/quizSession');
const { registerLeaderboardHandlers } = require('./socket/leaderboard');
const { registerNotificationHandlers } = require('./socket/notifications');
const { socketAuthMiddleware, socketOptionalAuth } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

// ── REST health check ────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'quizcraft-realtime' });
});

// ── Socket.io namespaces ─────────────────────────────────────

// /quiz-session -- uses optional auth (guests can join public quizzes)
const quizSessionNs = io.of('/quiz-session');
quizSessionNs.use(socketOptionalAuth);
quizSessionNs.on('connection', (socket) => {
  registerQuizSessionHandlers(quizSessionNs, socket);
});

// /leaderboard -- public, no auth required
const leaderboardNs = io.of('/leaderboard');
leaderboardNs.on('connection', (socket) => {
  registerLeaderboardHandlers(leaderboardNs, socket);
});

// /notifications -- requires auth
const notificationsNs = io.of('/notifications');
notificationsNs.use(socketAuthMiddleware);
notificationsNs.on('connection', (socket) => {
  registerNotificationHandlers(notificationsNs, socket);
});

// ── Start server ─────────────────────────────────────────────
const PORT = process.env.REALTIME_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Realtime service listening on port ${PORT}`);
});

module.exports = { io, quizSessionNs, leaderboardNs, notificationsNs };

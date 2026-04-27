const { getPool } = require('../config/db');

function registerLeaderboardHandlers(namespace, socket) {
  // Subscribe to leaderboard updates for a specific quiz
  socket.on('join-leaderboard', ({ quizId }) => {
    socket.join(`leaderboard:${quizId}`);
    sendLeaderboard(socket, quizId);
  });

  socket.on('leave-leaderboard', ({ quizId }) => {
    socket.leave(`leaderboard:${quizId}`);
  });

  // Called by the PHP API (or internally) when a new attempt is submitted
  socket.on('attempt:submitted', ({ quizId }) => {
    broadcastLeaderboard(namespace, quizId);
  });
}

async function sendLeaderboard(socket, quizId) {
  try {
    const entries = await fetchLeaderboard(quizId);
    socket.emit('server:leaderboard-update', { quizId, entries });
  } catch {
    socket.emit('error', { message: 'Failed to fetch leaderboard' });
  }
}

async function broadcastLeaderboard(namespace, quizId) {
  try {
    const entries = await fetchLeaderboard(quizId);
    namespace.to(`leaderboard:${quizId}`).emit('server:leaderboard-update', { quizId, entries });
  } catch {
    // Silently fail for broadcast
  }
}

async function fetchLeaderboard(quizId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, participant_id, participant_name, score, total_points, percentage, time_taken, completed_at
     FROM quiz_attempts WHERE quiz_id = ? ORDER BY percentage DESC, time_taken ASC`,
    [quizId]
  );

  return rows.map(r => ({
    id: r.id,
    participantId: r.participant_id,
    participantName: r.participant_name,
    score: r.score,
    totalPoints: r.total_points,
    percentage: r.percentage,
    timeTaken: r.time_taken,
    completedAt: r.completed_at,
  }));
}

module.exports = { registerLeaderboardHandlers, broadcastLeaderboard };

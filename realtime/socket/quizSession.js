const { getPool } = require('../config/db');

// In-memory session store: shareCode -> session state
const sessions = new Map();

function createSession(quizId, shareCode, hostId, quiz) {
  const session = {
    quizId,
    shareCode,
    hostId,
    hostSocketId: null,
    quiz,
    participants: new Map(), // socketId -> { id, name, score }
    currentQuestionIndex: -1,
    started: false,
    ended: false,
    answers: new Map(), // questionId -> Map<socketId, answer>
  };
  sessions.set(shareCode, session);
  return session;
}

function registerQuizSessionHandlers(namespace, socket) {
  // ── Host creates a live session ──────────────────────────
  socket.on('host:create-session', async ({ quizId, shareCode }) => {
    try {
      const pool = getPool();
      const [quizRows] = await pool.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
      if (!quizRows.length) {
        return socket.emit('error', { message: 'Quiz not found' });
      }

      const quiz = quizRows[0];

      if (socket.user && quiz.creator_id !== socket.user.sub) {
        return socket.emit('error', { message: 'Only the quiz owner can host' });
      }

      const [questions] = await pool.query(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY question_order',
        [quizId]
      );

      for (const q of questions) {
        const [opts] = await pool.query(
          'SELECT * FROM question_options WHERE question_id = ? ORDER BY option_order',
          [q.id]
        );
        q.options = opts;
        q.correct_answers = JSON.parse(q.correct_answers || '[]');
        q.blank_words = q.blank_words ? JSON.parse(q.blank_words) : null;
      }

      quiz.questions = questions;
      const session = createSession(quizId, shareCode, socket.user?.sub, quiz);
      session.hostSocketId = socket.id;

      socket.join(`session:${shareCode}`);
      socket.emit('session:created', { shareCode, questionCount: questions.length });
    } catch (err) {
      socket.emit('error', { message: 'Failed to create session' });
    }
  });

  // ── Participant joins ────────────────────────────────────
  socket.on('participant:join-session', ({ shareCode, name }) => {
    const session = sessions.get(shareCode);
    if (!session) {
      return socket.emit('error', { message: 'Session not found' });
    }
    if (session.ended) {
      return socket.emit('error', { message: 'Session has ended' });
    }

    const participant = {
      id: socket.user?.sub || socket.id,
      name: name || socket.user?.display_name || 'Anonymous',
      score: 0,
    };
    session.participants.set(socket.id, participant);

    socket.join(`session:${shareCode}`);
    socket.emit('session:joined', {
      shareCode,
      started: session.started,
      questionCount: session.quiz.questions.length,
    });

    namespace.to(`session:${shareCode}`).emit('server:participant-count', {
      count: session.participants.size,
      participants: Array.from(session.participants.values()).map(p => ({ id: p.id, name: p.name })),
    });
  });

  // ── Host starts the quiz ─────────────────────────────────
  socket.on('host:start-quiz', ({ shareCode }) => {
    const session = sessions.get(shareCode);
    if (!session || session.hostSocketId !== socket.id) return;

    session.started = true;
    session.currentQuestionIndex = 0;

    const q = session.quiz.questions[0];
    namespace.to(`session:${shareCode}`).emit('server:question', {
      index: 0,
      total: session.quiz.questions.length,
      question: sanitizeQuestion(q),
    });
  });

  // ── Host advances to next question ───────────────────────
  socket.on('host:next-question', ({ shareCode }) => {
    const session = sessions.get(shareCode);
    if (!session || session.hostSocketId !== socket.id) return;

    session.currentQuestionIndex++;
    const idx = session.currentQuestionIndex;

    if (idx >= session.quiz.questions.length) {
      session.ended = true;
      const leaderboard = Array.from(session.participants.values())
        .sort((a, b) => b.score - a.score);

      namespace.to(`session:${shareCode}`).emit('server:session-ended', { leaderboard });
      sessions.delete(shareCode);
      return;
    }

    const q = session.quiz.questions[idx];
    namespace.to(`session:${shareCode}`).emit('server:question', {
      index: idx,
      total: session.quiz.questions.length,
      question: sanitizeQuestion(q),
    });
  });

  // ── Participant submits an answer ────────────────────────
  socket.on('participant:answer', ({ shareCode, questionId, selectedAnswers }) => {
    const session = sessions.get(shareCode);
    if (!session || !session.started) return;

    const participant = session.participants.get(socket.id);
    if (!participant) return;

    const question = session.quiz.questions.find(q => q.id === questionId);
    if (!question) return;

    const correct = question.correct_answers;
    let isCorrect = false;

    if (question.type === 'fill_blank') {
      isCorrect = selectedAnswers[0]?.toLowerCase().trim() === correct[0]?.toLowerCase().trim();
    } else {
      isCorrect = selectedAnswers.length === correct.length &&
        selectedAnswers.every(a => correct.includes(a));
    }

    if (isCorrect) {
      participant.score += (question.points || 1);
    }

    socket.emit('answer:result', { questionId, isCorrect, correctAnswers: correct });

    // Notify host of answer submission
    if (session.hostSocketId) {
      namespace.to(session.hostSocketId).emit('host:answer-received', {
        participantName: participant.name,
        questionId,
        isCorrect,
        participantScore: participant.score,
      });
    }
  });

  // ── Disconnect cleanup ───────────────────────────────────
  socket.on('disconnect', () => {
    for (const [code, session] of sessions) {
      if (session.participants.has(socket.id)) {
        session.participants.delete(socket.id);
        namespace.to(`session:${code}`).emit('server:participant-count', {
          count: session.participants.size,
          participants: Array.from(session.participants.values()).map(p => ({ id: p.id, name: p.name })),
        });
      }
      if (session.hostSocketId === socket.id) {
        session.ended = true;
        namespace.to(`session:${code}`).emit('server:session-ended', {
          leaderboard: Array.from(session.participants.values()).sort((a, b) => b.score - a.score),
          reason: 'host_disconnected',
        });
        sessions.delete(code);
      }
    }
  });
}

/**
 * Strip correct answers before sending to participants.
 */
function sanitizeQuestion(q) {
  return {
    id: q.id,
    type: q.type,
    text: q.text,
    options: (q.options || []).map(o => ({ id: o.id, text: o.text })),
    blankWords: q.blank_words,
    maxSelections: q.max_selections,
    points: q.points,
  };
}

module.exports = { registerQuizSessionHandlers };

import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from './client';
import type { Question } from '@/types/quiz';

interface Participant {
  id: string;
  name: string;
}

interface SessionState {
  connected: boolean;
  shareCode: string | null;
  started: boolean;
  ended: boolean;
  currentQuestion: (Omit<Question, 'correctAnswers'>) | null;
  questionIndex: number;
  totalQuestions: number;
  participants: Participant[];
  participantCount: number;
  leaderboard: Array<{ id: string; name: string; score: number }>;
  lastAnswerResult: { questionId: string; isCorrect: boolean; correctAnswers: string[] } | null;
}

export function useQuizSession() {
  const socketRef = useRef(getSocket('/quiz-session'));
  const [state, setState] = useState<SessionState>({
    connected: false,
    shareCode: null,
    started: false,
    ended: false,
    currentQuestion: null,
    questionIndex: -1,
    totalQuestions: 0,
    participants: [],
    participantCount: 0,
    leaderboard: [],
    lastAnswerResult: null,
  });

  useEffect(() => {
    const socket = socketRef.current;

    socket.on('connect', () => setState(s => ({ ...s, connected: true })));
    socket.on('disconnect', () => setState(s => ({ ...s, connected: false })));

    socket.on('session:created', ({ shareCode, questionCount }) => {
      setState(s => ({ ...s, shareCode, totalQuestions: questionCount }));
    });

    socket.on('session:joined', ({ shareCode, started, questionCount }) => {
      setState(s => ({ ...s, shareCode, started, totalQuestions: questionCount }));
    });

    socket.on('server:participant-count', ({ count, participants }) => {
      setState(s => ({ ...s, participantCount: count, participants }));
    });

    socket.on('server:question', ({ index, total, question }) => {
      setState(s => ({
        ...s,
        started: true,
        currentQuestion: question,
        questionIndex: index,
        totalQuestions: total,
        lastAnswerResult: null,
      }));
    });

    socket.on('answer:result', (result) => {
      setState(s => ({ ...s, lastAnswerResult: result }));
    });

    socket.on('server:session-ended', ({ leaderboard }) => {
      setState(s => ({ ...s, ended: true, leaderboard }));
    });

    socket.on('error', ({ message }) => {
      console.error('Quiz session error:', message);
    });

    return () => {
      socket.removeAllListeners();
      disconnectSocket('/quiz-session');
    };
  }, []);

  const createSession = useCallback((quizId: string, shareCode: string) => {
    socketRef.current.emit('host:create-session', { quizId, shareCode });
  }, []);

  const joinSession = useCallback((shareCode: string, name: string) => {
    socketRef.current.emit('participant:join-session', { shareCode, name });
  }, []);

  const startQuiz = useCallback((shareCode: string) => {
    socketRef.current.emit('host:start-quiz', { shareCode });
  }, []);

  const nextQuestion = useCallback((shareCode: string) => {
    socketRef.current.emit('host:next-question', { shareCode });
  }, []);

  const submitAnswer = useCallback((shareCode: string, questionId: string, selectedAnswers: string[]) => {
    socketRef.current.emit('participant:answer', { shareCode, questionId, selectedAnswers });
  }, []);

  return {
    ...state,
    createSession,
    joinSession,
    startQuiz,
    nextQuestion,
    submitAnswer,
  };
}

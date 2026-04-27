import { useEffect, useState, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from './client';
import type { QuizAttempt } from '@/types/quiz';

type LeaderboardEntry = Pick<QuizAttempt, 'id' | 'participantName' | 'score' | 'totalPoints' | 'percentage' | 'timeTaken' | 'completedAt'> & {
  participantId?: string;
};

export function useLiveLeaderboard(quizId: string | undefined) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!quizId) return;

    const socket = getSocket('/leaderboard');
    socketRef.current = socket;

    socket.emit('join-leaderboard', { quizId });

    socket.on('server:leaderboard-update', ({ entries: newEntries }) => {
      setEntries(newEntries);
    });

    return () => {
      socket.emit('leave-leaderboard', { quizId });
      socket.removeAllListeners();
      disconnectSocket('/leaderboard');
    };
  }, [quizId]);

  const notifyAttempt = useCallback((quizId: string) => {
    socketRef.current?.emit('attempt:submitted', { quizId });
  }, []);

  return { entries, notifyAttempt };
}

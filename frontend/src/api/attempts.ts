import { apiFetch } from './client';
import type { QuizAttempt, QuizStats } from '@/types/quiz';

export async function submitAttemptApi(quizId: string, attempt: Partial<QuizAttempt>): Promise<QuizAttempt> {
  const res = await apiFetch<QuizAttempt>(`/quizzes/${quizId}/attempts`, {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
  return res.data!;
}

export async function fetchQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const res = await apiFetch<QuizAttempt[]>(`/quizzes/${quizId}/attempts`);
  return res.data ?? [];
}

export async function fetchQuizStats(quizId: string): Promise<QuizStats | null> {
  const res = await apiFetch<QuizStats | null>(`/quizzes/${quizId}/stats`);
  return res.data ?? null;
}

export async function fetchLeaderboard(quizId: string): Promise<QuizAttempt[]> {
  const res = await apiFetch<QuizAttempt[]>(`/quizzes/${quizId}/leaderboard`);
  return res.data ?? [];
}

export async function fetchMyAttempts(): Promise<QuizAttempt[]> {
  const res = await apiFetch<QuizAttempt[]>('/attempts/me');
  return res.data ?? [];
}

export async function fetchGlobalStats(): Promise<{ totalQuizzes: number; totalAttempts: number }> {
  const res = await apiFetch<{ totalQuizzes: number; totalAttempts: number }>('/stats/global');
  return res.data ?? { totalQuizzes: 0, totalAttempts: 0 };
}

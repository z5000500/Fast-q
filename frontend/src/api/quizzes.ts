import { apiFetch } from './client';
import type { Quiz } from '@/types/quiz';

export async function fetchMyQuizzes(): Promise<Quiz[]> {
  const res = await apiFetch<Quiz[]>('/quizzes');
  return res.data ?? [];
}

export async function fetchQuizById(id: string): Promise<Quiz> {
  const res = await apiFetch<Quiz>(`/quizzes/${id}`);
  return res.data!;
}

export async function fetchQuizByShareCode(code: string): Promise<Quiz> {
  const res = await apiFetch<Quiz>(`/quizzes/join/${code}`);
  return res.data!;
}

export async function createQuizApi(quiz: Partial<Quiz>): Promise<Quiz> {
  const res = await apiFetch<Quiz>('/quizzes', {
    method: 'POST',
    body: JSON.stringify(quiz),
  });
  return res.data!;
}

export async function updateQuizApi(id: string, quiz: Partial<Quiz>): Promise<Quiz> {
  const res = await apiFetch<Quiz>(`/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(quiz),
  });
  return res.data!;
}

export async function deleteQuizApi(id: string): Promise<void> {
  await apiFetch(`/quizzes/${id}`, { method: 'DELETE' });
}

export async function duplicateQuizApi(id: string): Promise<Quiz> {
  const res = await apiFetch<Quiz>(`/quizzes/${id}/duplicate`, { method: 'POST' });
  return res.data!;
}

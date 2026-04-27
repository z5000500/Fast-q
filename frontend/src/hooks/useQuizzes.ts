import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/api/client';
import {
  fetchMyQuizzes,
  fetchQuizById,
  fetchQuizByShareCode,
  createQuizApi,
  updateQuizApi,
  deleteQuizApi,
  duplicateQuizApi,
} from '@/api/quizzes';
import {
  submitAttemptApi,
  fetchQuizAttempts,
  fetchQuizStats,
  fetchLeaderboard,
  fetchMyAttempts,
  fetchGlobalStats,
} from '@/api/attempts';
import type { Quiz, QuizAttempt } from '@/types/quiz';

// ── Quiz hooks ───────────────────────────────────────────────

export function useQuizzes(userId?: string) {
  const qc = useQueryClient();

  const { data: quizzes = [], isLoading: loading } = useQuery({
    queryKey: ['quizzes', userId],
    queryFn: fetchMyQuizzes,
    enabled: !!userId,
  });

  const createMutation = useMutation({
    mutationFn: (quiz: Partial<Quiz>) => createQuizApi(quiz),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quiz }: { id: string; quiz: Partial<Quiz> }) => updateQuizApi(id, quiz),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuizApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => duplicateQuizApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  return {
    quizzes,
    loading,
    createQuiz: createMutation.mutateAsync,
    updateQuiz: (quiz: Quiz) => updateMutation.mutateAsync({ id: quiz.id, quiz }),
    deleteQuiz: deleteMutation.mutateAsync,
    duplicateQuiz: duplicateMutation.mutateAsync,
    getQuizByShareCode: fetchQuizByShareCode,
    getQuizById: fetchQuizById,
    refresh: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  };
}

// ── Quiz by ID (single) ─────────────────────────────────────

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => fetchQuizById(id!),
    enabled: !!id,
  });
}

export function useQuizByShareCode(code: string | undefined) {
  return useQuery({
    queryKey: ['quiz', 'code', code],
    queryFn: () => fetchQuizByShareCode(code!),
    enabled: !!code,
  });
}

// ── Attempt hooks ────────────────────────────────────────────

export function useQuizAttempts(quizId?: string) {
  const qc = useQueryClient();

  const { data: attempts = [] } = useQuery({
    queryKey: ['attempts', quizId],
    queryFn: () => fetchQuizAttempts(quizId!),
    enabled: !!quizId && !!getAccessToken(),
  });

  const { data: stats = null } = useQuery({
    queryKey: ['stats', quizId],
    queryFn: () => fetchQuizStats(quizId!),
    enabled: !!quizId && !!getAccessToken(),
  });

  const submitMutation = useMutation({
    mutationFn: (attempt: Partial<QuizAttempt>) => submitAttemptApi(quizId!, attempt),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', quizId] });
      qc.invalidateQueries({ queryKey: ['stats', quizId] });
      qc.invalidateQueries({ queryKey: ['leaderboard', quizId] });
    },
  });

  return {
    attempts,
    submitAttempt: submitMutation.mutateAsync,
    getStats: () => stats,
    refresh: () => {
      qc.invalidateQueries({ queryKey: ['attempts', quizId] });
      qc.invalidateQueries({ queryKey: ['stats', quizId] });
    },
  };
}

export function useLeaderboard(quizId?: string) {
  return useQuery({
    queryKey: ['leaderboard', quizId],
    queryFn: () => fetchLeaderboard(quizId!),
    enabled: !!quizId,
  });
}

export function useUserAttempts(userId?: string) {
  const { data: attempts = [] } = useQuery({
    queryKey: ['myAttempts', userId],
    queryFn: fetchMyAttempts,
    enabled: !!userId,
  });

  return { attempts };
}

export function useGlobalStats() {
  const { data: stats } = useQuery({
    queryKey: ['globalStats'],
    queryFn: fetchGlobalStats,
  });

  return stats ?? { totalQuizzes: 0, totalAttempts: 0 };
}

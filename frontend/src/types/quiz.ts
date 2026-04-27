export type QuestionType = 'multiple_choice' | 'multiple_select' | 'true_false' | 'fill_blank';

export type AccessMode = 'public' | 'private';
export type TimerType = 'per_quiz' | 'per_question' | 'none';
export type QuizStatus = 'draft' | 'published';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface QuizSettings {
  accessMode: AccessMode;
  timerType: TimerType;
  timeLimitSeconds: number;
  shuffleQuestions: boolean;
  showResults: boolean;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctAnswers?: string[];
  blankWords?: string[];
  maxSelections?: number;
  order: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  settings: QuizSettings;
  status: QuizStatus;
  shareCode: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface AttemptAnswer {
  questionId: string;
  selectedAnswers: string[];
  isCorrect: boolean;
  timeTaken: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  participantId?: string;
  participantName: string;
  score: number;
  totalPoints: number;
  percentage: number;
  answers: AttemptAnswer[];
  correctAnswers?: Record<string, string[]>;
  startedAt: string;
  completedAt: string;
  timeTaken: number;
}

export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageTime: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'attempt_completed' | 'quiz_shared' | 'system';
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface QuizSession {
  shareCode: string;
  quizId: string;
  hostId: string;
  started: boolean;
  ended: boolean;
  currentQuestionIndex: number;
  participantCount: number;
}

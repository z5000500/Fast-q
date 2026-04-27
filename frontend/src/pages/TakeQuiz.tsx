import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuiz, useQuizByShareCode, useQuizAttempts } from '@/hooks/useQuizzes';
import { useLiveLeaderboard } from '@/socket/useLeaderboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ArrowRight, ArrowLeft, Send, AlertCircle } from 'lucide-react';
import type { Quiz, AttemptAnswer, QuizAttempt } from '@/types/quiz';

const questionTypeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  multiple_select: 'Multiple Select',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

const TakeQuiz: React.FC = () => {
  const { id, code } = useParams<{ id?: string; code?: string }>();
  const { user } = useAuth();
  const { data: quizById } = useQuiz(id);
  const { data: quizByCode } = useQuizByShareCode(code);
  const quiz: Quiz | undefined = quizById || quizByCode;
  const { submitAttempt } = useQuizAttempts(quiz?.id);
  const { notifyAttempt } = useLiveLeaderboard(quiz?.id);
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [participantName, setParticipantName] = useState(user?.displayName || '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [questionTimes, setQuestionTimes] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);

  useEffect(() => {
    if (quiz?.settings.timerType !== 'none' && quiz) {
      setTimeLeft(quiz.settings.timeLimitSeconds);
    }
  }, [quiz]);

  useEffect(() => {
    if (!started || submitted || !quiz || quiz.settings.timerType === 'none') return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [started, submitted, timeLeft, quiz]);

  useEffect(() => {
    if (started && quiz?.settings.timerType === 'per_question') {
      setTimeLeft(quiz.settings.timeLimitSeconds);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, started]);

  const toggleAnswer = (questionId: string, answerId: string, isMulti: boolean, maxSelections?: number) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (isMulti) {
        if (current.includes(answerId)) {
          return { ...prev, [questionId]: current.filter(a => a !== answerId) };
        }
        if (maxSelections && current.length >= maxSelections) return prev;
        return { ...prev, [questionId]: [...current, answerId] };
      }
      return { ...prev, [questionId]: [answerId] };
    });
  };

  const setFillBlankAnswer = (questionId: string, word: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: [word] }));
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz || submitted) return;
    setSubmitted(true);

    const attemptAnswers = quiz.questions.map(q => ({
      questionId: q.id,
      selectedAnswers: answers[q.id] || [],
      timeTaken: questionTimes[q.id] || 0,
    }));

    const attemptData = {
      participantName,
      answers: attemptAnswers,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      timeTaken: Math.round((Date.now() - startTime) / 1000),
    };

    try {
      const saved = await submitAttempt(attemptData as any);
      setResult(saved);
      notifyAttempt(quiz.id);
    } catch {
      setSubmitted(false);
    }
  }, [quiz, answers, submitted, participantName, user, startTime, questionTimes, submitAttempt, notifyAttempt]);

  const startQuiz = () => {
    if (!participantName.trim()) return;
    setStarted(true);
    setStartTime(Date.now());
    setQuestionStartTime(Date.now());
  };

  const goNext = () => {
    if (!quiz) return;
    const q = quiz.questions[currentIndex];
    setQuestionTimes(prev => ({ ...prev, [q.id]: Math.round((Date.now() - questionStartTime) / 1000) }));
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="font-medium">Quiz not found</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-6xl font-heading font-bold text-primary">{result.percentage}%</p>
                <p className="mt-2 text-muted-foreground">{result.score} / {result.totalPoints} points · {formatTime(result.timeTaken)}</p>
              </div>

              {quiz.settings.showResults && result.correctAnswers && (
                <div className="space-y-3">
                  <h3 className="font-heading font-semibold">Answer Review</h3>
                  {quiz.questions.map((q, i) => {
                    const ans = result.answers.find(a => a.questionId === q.id);
                    const correct: string[] = (result.correctAnswers as Record<string, string[]>)?.[q.id] ?? [];
                    return (
                      <div key={q.id} className={`rounded-lg border p-4 ${ans?.isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                        <p className="mb-2 text-sm font-medium">Q{i + 1}: {q.text}</p>
                        {q.type === 'fill_blank' ? (
                          <div className="text-sm">
                            <p>Your answer: <span className="font-medium">{ans?.selectedAnswers[0] || '—'}</span></p>
                            <p>Correct: <span className="font-medium text-success">{correct[0]}</span></p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {q.options.map(opt => {
                              const isSelected = ans?.selectedAnswers.includes(opt.id);
                              const isCorrectOpt = correct.includes(opt.id);
                              return (
                                <div key={opt.id} className={`rounded px-3 py-1.5 text-sm ${isCorrectOpt ? 'bg-success/20 font-medium' : isSelected && !isCorrectOpt ? 'bg-destructive/20 line-through' : ''}`}>
                                  {opt.text} {isCorrectOpt && '✓'} {isSelected && !isCorrectOpt && '✗'}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => navigate('/')} variant="outline" className="flex-1">Go Home</Button>
                <Button onClick={() => navigate(`/quiz/${quiz.id}/leaderboard`)} className="flex-1">Leaderboard</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-xl">{quiz.title}</CardTitle>
              {quiz.description && <p className="text-sm text-muted-foreground">{quiz.description}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-1">
                <p>{quiz.questions.length} questions</p>
                {quiz.settings.timerType !== 'none' && (
                  <p>Time limit: {formatTime(quiz.settings.timeLimitSeconds)} {quiz.settings.timerType === 'per_question' ? 'per question' : 'total'}</p>
                )}
                <p>Created by {quiz.creatorName}</p>
              </div>

              {quiz.settings.accessMode === 'public' && (
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input placeholder="Enter your name..." value={participantName} onChange={e => setParticipantName(e.target.value)} />
                </div>
              )}

              <Button className="w-full" onClick={startQuiz} disabled={!participantName.trim()}>
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <span className="text-sm font-medium">Q{currentIndex + 1} of {quiz.questions.length}</span>
          <Progress value={progress} className="mx-6 h-2 flex-1" />
          {quiz.settings.timerType !== 'none' && (
            <span className={`flex items-center gap-1 text-sm font-mono font-medium ${timeLeft < 30 ? 'text-destructive' : ''}`}>
              <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="container flex flex-1 items-center justify-center py-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="w-full max-w-2xl">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{questionTypeLabels[currentQuestion.type]}</span>
                  <span className="text-sm text-muted-foreground">{currentQuestion.points} pts</span>
                </div>
                <CardTitle className="font-heading text-xl">{currentQuestion.text}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentQuestion.type === 'fill_blank' ? (
                  <div className="space-y-4">
                    <div
                      className={`flex min-h-[60px] items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${answers[currentQuestion.id]?.length ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => { if (draggedWord) setFillBlankAnswer(currentQuestion.id, draggedWord); setDraggedWord(null); }}
                    >
                      {answers[currentQuestion.id]?.[0] ? (
                        <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{answers[currentQuestion.id][0]}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Drag a word here</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.blankWords?.map(word => (
                        <div
                          key={word}
                          draggable
                          onDragStart={() => setDraggedWord(word)}
                          onClick={() => setFillBlankAnswer(currentQuestion.id, word)}
                          className={`cursor-grab rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted active:cursor-grabbing ${answers[currentQuestion.id]?.[0] === word ? 'border-primary bg-primary/10 text-primary' : 'bg-card'}`}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  currentQuestion.options.map(opt => {
                    const isSelected = answers[currentQuestion.id]?.includes(opt.id);
                    const isMulti = currentQuestion.type === 'multiple_select';
                    const atMax = isMulti && currentQuestion.maxSelections && !isSelected && (answers[currentQuestion.id]?.length || 0) >= currentQuestion.maxSelections;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleAnswer(currentQuestion.id, opt.id, isMulti, currentQuestion.maxSelections)}
                        disabled={!!atMax}
                        className={`w-full rounded-lg border p-4 text-left text-sm font-medium transition-all ${isSelected ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : atMax ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'}`}
                      >
                        {opt.text}
                        {isMulti && currentQuestion.maxSelections && (
                          <span className="float-right text-xs text-muted-foreground">{answers[currentQuestion.id]?.length || 0}/{currentQuestion.maxSelections}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="gap-1">
                <ArrowLeft className="h-4 w-4" /> Previous
              </Button>
              {currentIndex === quiz.questions.length - 1 ? (
                <Button onClick={handleSubmit} className="gap-1"><Send className="h-4 w-4" /> Submit</Button>
              ) : (
                <Button onClick={goNext} className="gap-1">Next <ArrowRight className="h-4 w-4" /></Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TakeQuiz;

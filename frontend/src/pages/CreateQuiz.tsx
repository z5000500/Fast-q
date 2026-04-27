import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import { fetchQuizById } from '@/api/quizzes';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Save, Eye, ArrowLeft, Check, X, AlertCircle } from 'lucide-react';
import type { Quiz, Question, QuestionOption, QuestionType, AccessMode, TimerType, QuizSettings } from '@/types/quiz';

const defaultSettings: QuizSettings = {
  accessMode: 'public',
  timerType: 'none',
  timeLimitSeconds: 300,
  shuffleQuestions: false,
  showResults: true,
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  multiple_select: 'Multiple Select',
  true_false: 'True / False',
  fill_blank: 'Fill in the Blank',
};

function createOption(text = ''): QuestionOption {
  return { id: crypto.randomUUID(), text };
}

function createQuestion(quizId: string, order: number): Question {
  return {
    id: crypto.randomUUID(),
    quizId,
    type: 'multiple_choice',
    text: '',
    options: [createOption(''), createOption(''), createOption(''), createOption('')],
    correctAnswers: [],
    order,
    points: 1,
  };
}

const FillBlankEditor: React.FC<{
  question: Question;
  onUpdate: (partial: Partial<Question>) => void;
}> = ({ question, onUpdate }) => {
  const [newWord, setNewWord] = useState('');

  const addWord = () => {
    const word = newWord.trim();
    if (!word) return;
    const words = [...(question.blankWords || []), word];
    onUpdate({ blankWords: words });
    setNewWord('');
  };

  const removeWord = (word: string) => {
    const words = (question.blankWords || []).filter(w => w !== word);
    onUpdate({ blankWords: words });
    if (question.correctAnswers.includes(word)) {
      onUpdate({ blankWords: words, correctAnswers: question.correctAnswers.filter(a => a !== word) });
    }
  };

  const toggleCorrect = (word: string) => {
    const has = question.correctAnswers.includes(word);
    onUpdate({
      correctAnswers: has ? question.correctAnswers.filter(a => a !== word) : [...question.correctAnswers, word],
    });
  };

  const sentenceParts = question.text.split('___');
  const hasBlank = sentenceParts.length > 1;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Sentence (use ___ to mark blank positions)</Label>
        <Textarea
          placeholder='Example: The capital of France is ___.'
          value={question.text}
          onChange={e => onUpdate({ text: e.target.value })}
          rows={2}
        />
        {!hasBlank && question.text.trim() && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Add ___ where the blank should appear
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Word Bank (click to mark as correct answer)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a word..."
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addWord())}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={addWord} className="gap-1">
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>

        {(question.blankWords?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {question.blankWords?.map(word => {
              const isCorrect = question.correctAnswers.includes(word);
              return (
                <Badge
                  key={word}
                  variant={isCorrect ? 'default' : 'outline'}
                  className={`cursor-pointer gap-1 px-3 py-1.5 text-sm ${
                    isCorrect ? 'bg-success hover:bg-success/90 text-success-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleCorrect(word)}
                >
                  {word}
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeWord(word); }}
                    className="ml-1 rounded-full hover:bg-background/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Click a word to toggle it as a correct answer. Green = correct.
        </p>
      </div>

      {hasBlank && (question.blankWords?.length || 0) > 0 && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Preview (how it looks to participants)</Label>
          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <p className="text-sm font-medium">
              {sentenceParts.map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < sentenceParts.length - 1 && (
                    <span className="mx-1 inline-flex min-w-[80px] items-center justify-center rounded-md border-2 border-dashed border-primary/40 bg-background px-3 py-1 text-primary">
                      {question.correctAnswers[i] || '___'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </p>
            <div className="flex flex-wrap gap-2">
              {question.blankWords?.map(word => (
                <span key={word} className="rounded-lg border bg-card px-3 py-1.5 text-sm font-medium shadow-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateQuiz: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { createQuiz, updateQuiz } = useQuizzes(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizId] = useState(id || crypto.randomUUID());
  const [activeQuestion, setActiveQuestion] = useState<number>(0);
  const [existingQuiz, setExistingQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    if (id) {
      fetchQuizById(id).then(existing => {
        setExistingQuiz(existing);
        setTitle(existing.title);
        setDescription(existing.description);
        setSettings(existing.settings);
        setQuestions(existing.questions);
      }).catch(() => {});
    }
  }, [id]);

  const addQuestion = () => {
    const q = createQuestion(quizId, questions.length);
    setQuestions([...questions, q]);
    setActiveQuestion(questions.length);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }));
    setQuestions(updated);
    if (activeQuestion >= updated.length) setActiveQuestion(Math.max(0, updated.length - 1));
  };

  const updateQuestion = (index: number, partial: Partial<Question>) => {
    setQuestions(questions.map((q, i) => i === index ? { ...q, ...partial } : q));
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const q = questions[qIndex];
    const opts = q.options.map((o, i) => i === oIndex ? { ...o, text } : o);
    updateQuestion(qIndex, { options: opts });
  };

  const toggleCorrectAnswer = (qIndex: number, optionId: string) => {
    const q = questions[qIndex];
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      updateQuestion(qIndex, { correctAnswers: [optionId] });
    } else {
      const has = q.correctAnswers.includes(optionId);
      updateQuestion(qIndex, {
        correctAnswers: has ? q.correctAnswers.filter(id => id !== optionId) : [...q.correctAnswers, optionId],
      });
    }
  };

  const changeQuestionType = (qIndex: number, type: QuestionType) => {
    let options = questions[qIndex].options;
    if (type === 'true_false') {
      options = [createOption('True'), createOption('False')];
    } else if (type === 'fill_blank') {
      options = [];
    } else if (options.length < 2) {
      options = [createOption(''), createOption(''), createOption(''), createOption('')];
    }
    updateQuestion(qIndex, { type, options, correctAnswers: [], blankWords: type === 'fill_blank' ? [] : undefined });
  };

  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    updateQuestion(qIndex, { options: [...q.options, createOption('')] });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const q = questions[qIndex];
    const removed = q.options[oIndex];
    updateQuestion(qIndex, {
      options: q.options.filter((_, i) => i !== oIndex),
      correctAnswers: q.correctAnswers.filter(id => id !== removed.id),
    });
  };

  const isQuestionComplete = (q: Question): boolean => {
    if (!q.text.trim()) return false;
    if (q.type === 'fill_blank') {
      return q.correctAnswers.length > 0 && q.correctAnswers[0].trim() !== '' && (q.blankWords?.length || 0) > 0;
    }
    return q.correctAnswers.length > 0 && q.options.every(o => o.text.trim() !== '');
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    if (status === 'published' && questions.length === 0) {
      toast({ title: 'Add at least one question', variant: 'destructive' });
      return;
    }
    if (status === 'published') {
      const incomplete = questions.filter(q => !isQuestionComplete(q));
      if (incomplete.length > 0) {
        toast({ title: `${incomplete.length} question(s) incomplete`, description: 'Fill in all question text, options, and correct answers.', variant: 'destructive' });
        return;
      }
    }

    const quizData: Partial<Quiz> = {
      id: quizId,
      title,
      description,
      settings,
      status,
      questions,
    };

    try {
      if (id && existingQuiz) {
        await updateQuiz({ ...existingQuiz, ...quizData } as Quiz);
      } else {
        await createQuiz(quizData);
      }
      toast({ title: status === 'published' ? 'Quiz published!' : 'Draft saved!' });
      navigate('/my-quizzes');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save quiz';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const currentQ = questions[activeQuestion];

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-heading text-2xl font-bold">{id ? 'Edit Quiz' : 'Create Quiz'}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input placeholder="Enter quiz title..." value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="What's this quiz about?" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Questions ({questions.length})</h2>
                <Button onClick={addQuestion} size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Add Question
                </Button>
              </div>

              {questions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No questions yet. Click "Add Question" to get started.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {questions.map((q, i) => {
                    const complete = isQuestionComplete(q);
                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestion(i)}
                        className={`relative shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                          i === activeQuestion ? 'border-primary bg-primary/10 text-primary' : 'bg-card hover:bg-muted'
                        }`}
                      >
                        {!complete && <AlertCircle className="absolute -right-1 -top-1 h-3.5 w-3.5 text-destructive" />}
                        Q{i + 1}
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait">
                {currentQ && (
                  <motion.div key={currentQ.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Card>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Question {activeQuestion + 1}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Select value={currentQ.type} onValueChange={(v) => changeQuestionType(activeQuestion, v as QuestionType)}>
                              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(questionTypeLabels).map(([val, label]) => (
                                  <SelectItem key={val} value={val}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeQuestion(activeQuestion)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentQ.type !== 'fill_blank' && (
                          <div className="space-y-2">
                            <Label>Question Text</Label>
                            <Textarea placeholder="Type your question..." value={currentQ.text} onChange={e => updateQuestion(activeQuestion, { text: e.target.value })} rows={2} />
                          </div>
                        )}

                        <div className="flex items-center gap-4">
                          <div className="space-y-1">
                            <Label>Points</Label>
                            <Input type="number" min={1} className="w-20" value={currentQ.points} onChange={e => updateQuestion(activeQuestion, { points: parseInt(e.target.value) || 1 })} />
                          </div>
                        </div>

                        {currentQ.type === 'fill_blank' ? (
                          <FillBlankEditor question={currentQ} onUpdate={(partial) => updateQuestion(activeQuestion, partial)} />
                        ) : (
                          <div className="space-y-3">
                            <Label>
                              Options {currentQ.type === 'multiple_select' && '(select all correct answers)'}
                              {currentQ.type === 'multiple_choice' && '(select one correct answer)'}
                            </Label>
                            {currentQ.type === 'multiple_select' && (
                              <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
                                <Label className="text-sm text-muted-foreground">Max selections allowed</Label>
                                <Input type="number" min={1} max={currentQ.options.length} className="w-20" placeholder="All" value={currentQ.maxSelections || ''} onChange={e => updateQuestion(activeQuestion, { maxSelections: parseInt(e.target.value) || undefined })} />
                                <span className="text-xs text-muted-foreground">Leave empty for unlimited</span>
                              </div>
                            )}
                            {currentQ.options.map((opt, oIdx) => (
                              <div key={opt.id} className="flex items-center gap-2">
                                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <button type="button" onClick={() => toggleCorrectAnswer(activeQuestion, opt.id)} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${currentQ.correctAnswers.includes(opt.id) ? 'border-success bg-success text-success-foreground' : 'border-muted-foreground/30'}`}>
                                  {currentQ.correctAnswers.includes(opt.id) && <Check className="h-3 w-3" />}
                                </button>
                                <Input placeholder={`Option ${oIdx + 1}`} value={opt.text} onChange={e => updateOption(activeQuestion, oIdx, e.target.value)} className="flex-1" />
                                {currentQ.type !== 'true_false' && currentQ.options.length > 2 && (
                                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeOption(activeQuestion, oIdx)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {currentQ.type !== 'true_false' && (
                              <Button variant="outline" size="sm" onClick={() => addOption(activeQuestion)} className="gap-1">
                                <Plus className="h-3 w-3" /> Add Option
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Mode</Label>
                  <Select value={settings.accessMode} onValueChange={v => setSettings({ ...settings, accessMode: v as AccessMode })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (name only)</SelectItem>
                      <SelectItem value="private">Private (login required)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timer</Label>
                  <Select value={settings.timerType} onValueChange={v => setSettings({ ...settings, timerType: v as TimerType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Timer</SelectItem>
                      <SelectItem value="per_quiz">Per Quiz</SelectItem>
                      <SelectItem value="per_question">Per Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {settings.timerType !== 'none' && (
                  <div className="space-y-2">
                    <Label>Time Limit (seconds)</Label>
                    <Input type="number" min={10} value={settings.timeLimitSeconds} onChange={e => setSettings({ ...settings, timeLimitSeconds: parseInt(e.target.value) || 300 })} />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>Shuffle Questions</Label>
                  <Switch checked={settings.shuffleQuestions} onCheckedChange={v => setSettings({ ...settings, shuffleQuestions: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Results</Label>
                  <Switch checked={settings.showResults} onCheckedChange={v => setSettings({ ...settings, showResults: v })} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button className="w-full gap-2" onClick={() => handleSave('published')}>
                <Eye className="h-4 w-4" /> Publish Quiz
              </Button>
              <Button variant="outline" className="w-full gap-2" onClick={() => handleSave('draft')}>
                <Save className="h-4 w-4" /> Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateQuiz;

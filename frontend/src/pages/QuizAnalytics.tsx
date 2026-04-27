import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz, useQuizAttempts } from '@/hooks/useQuizzes';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatsCard from '@/components/StatsCard';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Users, Trophy, TrendingDown, Clock, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const QuizAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: quiz } = useQuiz(id);
  const { attempts, getStats } = useQuizAttempts(id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const stats = getStats();

  if (!quiz) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p>Quiz not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/join/${quiz.shareCode}`);
    toast({ title: 'Link copied!' });
  };

  const distribution = [
    { range: '0-20%', count: attempts.filter(a => a.percentage <= 20).length },
    { range: '21-40%', count: attempts.filter(a => a.percentage > 20 && a.percentage <= 40).length },
    { range: '41-60%', count: attempts.filter(a => a.percentage > 40 && a.percentage <= 60).length },
    { range: '61-80%', count: attempts.filter(a => a.percentage > 60 && a.percentage <= 80).length },
    { range: '81-100%', count: attempts.filter(a => a.percentage > 80).length },
  ];

  const questionStats = quiz.questions.map((q, i) => {
    const correct = attempts.filter(a => a.answers.find(ans => ans.questionId === q.id)?.isCorrect).length;
    return {
      question: `Q${i + 1}`,
      text: q.text,
      correctPct: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
    };
  });

  const sortedAttempts = [...attempts].sort((a, b) => b.percentage - a.percentage);

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-heading text-2xl font-bold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">Analytics & Performance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={copyLink}>
              <Copy className="h-3 w-3" /> Share Link
            </Button>
            <Button variant="outline" size="sm" className="font-mono">{quiz.shareCode}</Button>
          </div>
        </div>

        {stats ? (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard label="Total Attempts" value={stats.totalAttempts} icon={<Users className="h-6 w-6" />} />
              <StatsCard label="Average Score" value={stats.averageScore} icon={<BarChart3 className="h-6 w-6" />} delay={100} />
              <StatsCard label="Highest Score" value={stats.highestScore} icon={<Trophy className="h-6 w-6" />} delay={200} />
              <StatsCard label="Lowest Score" value={stats.lowestScore} icon={<TrendingDown className="h-6 w-6" />} delay={300} />
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Score Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ChartContainer config={{ count: { label: 'Attempts', color: 'hsl(var(--primary))' } }} className="h-[240px]">
                    <BarChart data={distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Question Difficulty</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {questionStats.map(qs => (
                      <div key={qs.question} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{qs.question}</span>
                          <span className="text-muted-foreground">{qs.correctPct}% correct</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${qs.correctPct}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full bg-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Participants ({attempts.length})</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAttempts.map((a, i) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>{a.participantName}</TableCell>
                        <TableCell>{a.score}/{a.totalPoints}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.percentage >= 70 ? 'bg-success/10 text-success' : a.percentage >= 40 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                            {a.percentage}%
                          </span>
                        </TableCell>
                        <TableCell className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> {Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(a.completedAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No attempts yet. Share the quiz to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default QuizAnalytics;

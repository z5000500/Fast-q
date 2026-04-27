import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes, useUserAttempts } from '@/hooks/useQuizzes';
import { fetchQuizById } from '@/api/quizzes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/StatsCard';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Trophy, ArrowRight, Clock, CheckCircle2, Percent } from 'lucide-react';
import Layout from '@/components/Layout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { quizzes } = useQuizzes(user?.id);
  const { attempts: userAttempts } = useUserAttempts(user?.id);
  const navigate = useNavigate();

  const [quizTitles, setQuizTitles] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const ids = [...new Set(userAttempts.map(a => a.quizId))];
    ids.forEach(id => {
      if (!quizTitles[id]) {
        fetchQuizById(id).then(q => {
          setQuizTitles(prev => ({ ...prev, [id]: q.title }));
        }).catch(() => {});
      }
    });
  }, [userAttempts]);

  const recentQuizzes = quizzes.slice(-5).reverse();
  const recentAttempts = [...userAttempts].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5);

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {user?.displayName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's an overview of your quiz activity</p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <StatsCard label="Quizzes Created" value={quizzes.length} icon={<BookOpen className="h-6 w-6" />} delay={0} />
          <StatsCard label="Total Attempts" value={userAttempts.length} icon={<Trophy className="h-6 w-6" />} delay={150} />
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/create-quiz')} className="gap-2">
            <Plus className="h-4 w-4" /> Create New Quiz
          </Button>
          <Button variant="outline" onClick={() => navigate('/my-quizzes')} className="gap-2">
            <BookOpen className="h-4 w-4" /> My Quizzes
          </Button>
          <Button variant="outline" onClick={() => navigate('/join')} className="gap-2">
            <ArrowRight className="h-4 w-4" /> Join Quiz
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recently Taken Quizzes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentAttempts.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">You haven't taken any quizzes yet.</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => navigate('/join')}>
                    Join a Quiz <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAttempts.map(attempt => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{quizTitles[attempt.quizId] || 'Loading...'}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" /> {attempt.percentage}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> {attempt.score}/{attempt.totalPoints}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(attempt.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/quiz/${attempt.quizId}/leaderboard`)}>
                        View <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                My Created Quizzes
                {quizzes.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/my-quizzes')} className="gap-1 text-sm">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentQuizzes.length === 0 ? (
                <div className="py-8 text-center">
                  <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No quizzes yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentQuizzes.map(quiz => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{quiz.title}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {quiz.questions.length} questions
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(quiz.createdAt).toLocaleDateString()}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            quiz.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                          }`}>
                            {quiz.status}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/quiz/${quiz.id}/analytics`)}>
                        View <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

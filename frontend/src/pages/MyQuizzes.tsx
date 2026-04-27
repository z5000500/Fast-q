import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes } from '@/hooks/useQuizzes';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, BarChart3, Copy, Edit, BookOpen, Globe, Lock, CopyPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MyQuizzes: React.FC = () => {
  const { user } = useAuth();
  const { quizzes, deleteQuiz, duplicateQuiz } = useQuizzes(user?.id);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filtered = quizzes.filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  const copyLink = (shareCode: string) => {
    const url = `${window.location.origin}/quiz/join/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: 'Share this link with participants.' });
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteQuiz(deleteTarget);
      toast({ title: 'Quiz deleted' });
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    await duplicateQuiz(quizId);
    toast({ title: 'Quiz duplicated!', description: 'A draft copy has been created.' });
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">My Quizzes</h1>
            <p className="text-muted-foreground">{quizzes.length} quizzes total</p>
          </div>
          <Button onClick={() => navigate('/create-quiz')} className="gap-2">
            <Plus className="h-4 w-4" /> New Quiz
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search quizzes..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">{search ? 'No quizzes match your search' : 'No quizzes yet'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {quiz.settings.accessMode === 'public' ? (
                          <Globe className="h-4 w-4 text-success" />
                        ) : (
                          <Lock className="h-4 w-4 text-warning" />
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          quiz.status === 'published' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                        }`}>
                          {quiz.status}
                        </span>
                      </div>
                      <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{quiz.shareCode}</span>
                    </div>

                    <h3 className="mb-1 font-heading font-semibold">{quiz.title}</h3>
                    <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{quiz.description || 'No description'}</p>

                    <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{quiz.questions.length} questions</span>
                      <span>•</span>
                      <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/create-quiz/${quiz.id}`)}>
                        <Edit className="h-3 w-3" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/quiz/${quiz.id}/analytics`)}>
                        <BarChart3 className="h-3 w-3" /> Stats
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => copyLink(quiz.shareCode)}>
                        <Copy className="h-3 w-3" /> Link
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleDuplicate(quiz.id)}>
                        <CopyPlus className="h-3 w-3" /> Duplicate
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => setDeleteTarget(quiz.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Quiz</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this quiz? This action cannot be undone. All associated attempts and data will be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MyQuizzes;

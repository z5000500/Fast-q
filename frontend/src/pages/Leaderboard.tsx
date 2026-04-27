import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz, useLeaderboard } from '@/hooks/useQuizzes';
import { useLiveLeaderboard } from '@/socket/useLeaderboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Clock } from 'lucide-react';

const Leaderboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: quiz } = useQuiz(id);
  const { data: attempts = [] } = useLeaderboard(id);
  const { entries: liveEntries } = useLiveLeaderboard(id);
  const navigate = useNavigate();

  // Prefer live entries when available
  const displayEntries = liveEntries.length > 0 ? liveEntries : attempts;
  const sorted = [...displayEntries].sort((a, b) => b.percentage - a.percentage || a.timeTaken - b.timeTaken);

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-700'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{quiz?.title}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-primary" /> Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No attempts yet</p>
            ) : (
              <div className="space-y-2">
                {sorted.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${i < 3 ? 'bg-accent/50' : ''}`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center">
                      {i < 3 ? (
                        <Medal className={`h-6 w-6 ${medalColors[i]}`} />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">#{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.participantName}</p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-heading font-bold text-primary">{a.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{a.score}/{a.totalPoints}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    </div>
  );
};

export default Leaderboard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Layout from '@/components/Layout';

const JoinQuiz: React.FC = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/quiz/join/${code.trim().toUpperCase()}`);
    }
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="font-heading text-xl">Join a Quiz</CardTitle>
              <CardDescription>Enter the quiz code to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Quiz Code</Label>
                  <Input
                    placeholder="e.g. ABC123"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={8}
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={!code.trim()}>
                  Join Quiz <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default JoinQuiz;

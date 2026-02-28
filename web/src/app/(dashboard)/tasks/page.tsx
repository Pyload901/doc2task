'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Loader2, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Task {
  id: string;
  documentId: string;
  externalId: string | null;
  platform: string;
  status: string;
  createdAt: string;
  document: {
    title: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
        <p className="text-text-secondary mt-1">View tasks created from your documents</p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckSquare className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">No tasks created yet. Process a document to create tasks.</p>
            <Link href="/documents" className="text-primary hover:underline mt-2 inline-block">
              Go to Documents
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-text-primary">{task.document?.title || 'Unknown'}</h3>
                      <p className="text-sm text-text-secondary">
                        {task.platform} • {formatDate(task.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.status === 'CREATED' ? 'bg-success/10 text-success' :
                      task.status === 'FAILED' ? 'bg-error/10 text-error' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {task.status}
                    </span>
                    <Link href={`/documents/${task.documentId}`}>
                      <ArrowRight className="w-4 h-4 text-text-secondary" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

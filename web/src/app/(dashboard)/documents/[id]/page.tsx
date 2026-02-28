'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Zap, FileText } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  result: Record<string, unknown> | null;
  createdAt: string;
}

interface Task {
  id: string;
  externalId: string | null;
  platform: string;
  status: string;
  result: Record<string, unknown> | null;
  createdAt: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [platform, setPlatform] = useState('PLANE');

  useEffect(() => {
    if (params.id) {
      fetchDocument();
    }
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setDocument(data.document);
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDocument = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Failed to process document');
        return;
      }

      fetchDocument();
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Failed to process document');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Document not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/documents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Documents
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{document.title}</h1>
          <p className="text-text-secondary mt-1">Type: {document.type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Document Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-text-secondary font-mono">
                  {document.content}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Process & Create Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Target Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PLANE">Plane</option>
                  <option value="JIRA">Jira</option>
                  <option value="TRELLO">Trello</option>
                </select>
              </div>

              <Button
                className="w-full"
                onClick={processDocument}
                loading={processing}
                disabled={document.status === 'PROCESSING'}
              >
                <Zap className="w-4 h-4 mr-2" />
                Process & Create Tasks
              </Button>

              {document.status === 'PROCESSING' && (
                <p className="text-sm text-warning text-center">
                  Processing document... This may take a while.
                </p>
              )}
            </CardContent>
          </Card>

          {document.result && (
            <Card>
              <CardHeader>
                <CardTitle>AI Processing Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 rounded-lg p-4 text-sm text-text-secondary overflow-x-auto max-h-64">
                  {JSON.stringify(document.result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          {tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Created Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-text-primary">{task.platform}</p>
                        <p className="text-sm text-text-secondary">
                          {task.externalId ? `ID: ${task.externalId}` : 'Pending'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'CREATED' ? 'bg-success/10 text-success' :
                        task.status === 'FAILED' ? 'bg-error/10 text-error' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

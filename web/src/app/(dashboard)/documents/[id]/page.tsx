'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Zap, FileText, Pencil, Trash2, X, Save } from 'lucide-react';

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

interface ApiKey {
  id: string;
  name: string;
  provider: string;
}

const PRIVILEGED_ROLES = ['ADMIN', 'MANAGER'];

export default function DocumentDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [platform, setPlatform] = useState('PLANE');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState('');

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  const isPrivileged = PRIVILEGED_ROLES.includes(session?.user?.role ?? '');

  useEffect(() => {
    if (params.id) {
      fetchDocument();
      fetchApiKeys();
    }
  }, [params.id]);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);
        if (data.length > 0) {
          setSelectedApiKeyId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

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
    if (!selectedApiKeyId) {
      alert('Please select an API key before processing.');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${params.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, apiKeyId: selectedApiKeyId }),
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

  const startEditing = () => {
    if (!document) return;
    setEditTitle(document.title);
    setEditContent(document.content);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update document');
        return;
      }

      const updated = await res.json();
      setDocument(updated);
      setEditing(false);
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete document');
        return;
      }
      router.push('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setDeleting(false);
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/documents')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{document.title}</h1>
            <p className="text-text-secondary mt-1">Type: {document.type}</p>
          </div>
        </div>
        {isPrivileged && !editing && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
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
              {editing ? (
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Document title"
                    required
                  />
                  <Textarea
                    label="Content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Document content..."
                    rows={16}
                    required
                  />
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={cancelEditing} disabled={saving}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} loading={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-text-secondary font-mono">
                    {document.content}
                  </pre>
                </div>
              )}
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

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  API Key
                </label>
                {apiKeys.length === 0 ? (
                  <p className="text-sm text-text-secondary">
                    No API keys configured.{' '}
                    <a href="/settings/api-keys" className="text-primary hover:underline">
                      Add one in Settings
                    </a>
                  </p>
                ) : (
                  <select
                    value={selectedApiKeyId}
                    onChange={(e) => setSelectedApiKeyId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name} ({key.provider})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Button
                className="w-full"
                onClick={processDocument}
                loading={processing}
                disabled={document.status === 'PROCESSING' || apiKeys.length === 0}
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

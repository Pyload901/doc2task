'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'text' | 'file'>('text');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error);
          return;
        }
      } else {
        const res = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });

        if (!res.ok) {
          const error = await res.json();
          alert(error.error);
          return;
        }
      }

      setTitle('');
      setContent('');
      setFile(null);
      setShowForm(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'PROCESSING':
        return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-text-secondary" />;
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Documents</h1>
          <p className="text-text-secondary mt-1">Upload documents or enter text to process</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          New Document
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                required
              />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Content Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      checked={contentType === 'text'}
                      onChange={() => { setContentType('text'); setFile(null); }}
                      className="text-primary"
                    />
                    <span className="text-sm text-text-secondary">Text</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      checked={contentType === 'file'}
                      onChange={() => { setContentType('file'); setContent(''); }}
                      className="text-primary"
                    />
                    <span className="text-sm text-text-secondary">File</span>
                  </label>
                </div>
              </div>

              {contentType === 'file' ? (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">File</label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary-hover"
                  />
                </div>
              ) : (
                <Textarea
                  label="Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your text content here..."
                  rows={8}
                  required
                />
              )}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Create Document
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">No documents yet. Create your first document to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-text-primary">{doc.title}</h3>
                      <p className="text-sm text-text-secondary">
                        {doc.type} • {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/documents/${doc.id}`}>
                      View
                    </Button>
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

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Plus, Trash2, Loader2, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const res = await fetch('/api/settings/prompts');
      const data = await res.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setContent('');
    setIsDefault(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (prompt: PromptTemplate) => {
    setEditingId(prompt.id);
    setName(prompt.name);
    setContent(prompt.content);
    setIsDefault(prompt.isDefault);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, name, content, isDefault }
        : { name, content, isDefault };

      const res = await fetch('/api/settings/prompts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }

      resetForm();
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (prompt: PromptTemplate) => {
    try {
      await fetch('/api/settings/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prompt.id, isDefault: true }),
      });
      fetchPrompts();
    } catch (error) {
      console.error('Error setting default prompt:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt template?')) return;

    try {
      const res = await fetch(`/api/settings/prompts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Failed to delete prompt');
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
          <h1 className="text-2xl font-bold text-text-primary">Prompt Templates</h1>
          <p className="text-text-secondary mt-1">
            Manage the AI prompts used for document analysis
          </p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Template' : 'Add Template'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Task Extraction"
                required
              />
              <Textarea
                label="Prompt Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the prompt template. Use {document_content} as a placeholder for the document text."
                rows={8}
                required
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm text-text-primary">
                  Set as default prompt
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  {editingId ? 'Update' : 'Save'} Template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">No prompt templates yet.</p>
            <p className="text-sm text-text-secondary mt-1">
              A default prompt is created when the first admin registers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-text-primary">{prompt.name}</h3>
                        {prompt.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {prompt.content}
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        Updated {formatDate(prompt.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    {!prompt.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(prompt)}
                        title="Set as default"
                      >
                        <Star className="w-4 h-4 text-text-secondary" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(prompt)}
                      title="Edit"
                    >
                      <MessageSquare className="w-4 h-4 text-primary" />
                    </Button>
                    {!prompt.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prompt.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </Button>
                    )}
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

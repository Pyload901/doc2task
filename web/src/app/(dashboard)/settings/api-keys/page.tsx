'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Plus, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('OPENAI');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  useEffect(() => {
    if (provider === 'CUSTOM_MODEL') {
      setBaseUrl('https://api.deepseek.com');
      setModel('deepseek-chat');
    } else {
      setBaseUrl('');
      setModel('');
    }
  }, [provider]);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/settings/api-keys');
      const data = await res.json();
      setApiKeys(data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let apiKeyData = apiKey;
      
      if (provider === 'CUSTOM_MODEL') {
        apiKeyData = JSON.stringify({
          apiKey: apiKey,
          baseUrl: baseUrl,
          model: model
        });
      }

      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, apiKey: apiKeyData, provider }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }

      setName('');
      setApiKey('');
      setProvider('OPENAI');
      setBaseUrl('');
      setModel('');
      setShowForm(false);
      fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await fetch(`/api/settings/api-keys?id=${id}`, { method: 'DELETE' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
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
          <h1 className="text-2xl font-bold text-text-primary">API Keys</h1>
          <p className="text-text-secondary mt-1">Manage your API keys for AI and integrations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add API Key
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My OpenAI Key"
                required
              />
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="OPENAI">OpenAI</option>
                  <option value="CUSTOM_MODEL">Custom Model (DeepSeek, etc.)</option>
                </select>
              </div>
              <Input
                label="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                required
              />
              {provider === 'CUSTOM_MODEL' && (
                <>
                  <Input
                    label="Base URL"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.deepseek.com"
                    required
                  />
                  <Input
                    label="Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="deepseek-chat"
                    required
                  />
                  <p className="text-sm text-text-secondary">
                    Examples: DeepSeek (deepseek-chat), Google (gemini-2.0-flash), MiniMax (MiniMax-Text-01), Anthropic (claude-3-haiku), etc.
                  </p>
                </>
              )}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save API Key
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">No API keys configured yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Key className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-text-primary">{key.name}</h3>
                      <p className="text-sm text-text-secondary">
                        {key.provider} • Added {formatDate(key.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

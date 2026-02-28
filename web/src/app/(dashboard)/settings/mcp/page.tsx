'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Plus, Trash2, Loader2, Power, PowerOff } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const PLATFORMS = [
  {
    value: 'JIRA',
    label: 'Atlassian Jira',
    envVars: ['JIRA_HOST', 'JIRA_EMAIL', 'JIRA_API_TOKEN'],
  },
  {
    value: 'TRELLO',
    label: 'Trello',
    envVars: ['TRELLO_API_KEY', 'TRELLO_TOKEN'],
  },
  {
    value: 'PLANE',
    label: 'Plane',
    envVars: ['PLANE_API_KEY', 'PLANE_WORKSPACE_SLUG', 'PLANE_BASE_URL'],
  },
];

interface McpConfig {
  id: string;
  platform: string;
  envVars: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function McpSettingsPage() {
  const [configs, setConfigs] = useState<McpConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState('JIRA');
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    const selected = PLATFORMS.find((p) => p.value === platform);
    if (selected) {
      const vars: Record<string, string> = {};
      selected.envVars.forEach((v) => (vars[v] = ''));
      setEnvVars(vars);
    }
  }, [platform]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/settings/mcp');
      const data = await res.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching MCP configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/settings/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, envVars, isActive: true }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error);
        return;
      }

      setShowForm(false);
      setPlatform('JIRA');
      fetchConfigs();
    } catch (error) {
      console.error('Error saving MCP config:', error);
      alert('Failed to save configuration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (config: McpConfig) => {
    try {
      await fetch('/api/settings/mcp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: config.id, isActive: !config.isActive }),
      });
      fetchConfigs();
    } catch (error) {
      console.error('Error toggling MCP config:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this MCP configuration?')) return;

    try {
      await fetch(`/api/settings/mcp?id=${id}`, { method: 'DELETE' });
      fetchConfigs();
    } catch (error) {
      console.error('Error deleting MCP config:', error);
      alert('Failed to delete configuration');
    }
  };

  const getPlatformLabel = (value: string) =>
    PLATFORMS.find((p) => p.value === value)?.label || value;

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
          <h1 className="text-2xl font-bold text-text-primary">MCP Integrations</h1>
          <p className="text-text-secondary mt-1">
            Configure task management platform connections
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add MCP Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {Object.keys(envVars).map((key) => (
                <Input
                  key={key}
                  label={key}
                  type={key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                  value={envVars[key]}
                  onChange={(e) =>
                    setEnvVars((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`Enter ${key}`}
                  required
                />
              ))}

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  Save Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {configs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Server className="w-12 h-12 mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">No MCP integrations configured yet.</p>
            <p className="text-sm text-text-secondary mt-1">
              Add a Jira, Trello, or Plane integration to create tasks automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Server className="w-5 h-5 text-primary" />
                    <div>
                      <h3 className="font-medium text-text-primary">
                        {getPlatformLabel(config.platform)}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {config.isActive ? 'Active' : 'Inactive'} • Updated{' '}
                        {formatDate(config.updatedAt)}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        Variables: {Object.keys(config.envVars).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(config)}
                      title={config.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {config.isActive ? (
                        <Power className="w-4 h-4 text-success" />
                      ) : (
                        <PowerOff className="w-4 h-4 text-text-secondary" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="w-4 h-4 text-error" />
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

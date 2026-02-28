import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import prisma from '@/lib/prisma';

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session) {
    return null;
  }

  const userId = session.user?.id;
  
  if (!userId) {
    return null;
  }

  const [documentCount, taskCount, pendingCount, failedCount] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: 'PENDING' } }),
    prisma.task.count({ where: { userId, status: 'FAILED' } }),
  ]);

  const stats = [
    {
      name: 'Total Documents',
      value: documentCount,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      name: 'Tasks Created',
      value: taskCount,
      icon: CheckSquare,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      name: 'Pending Tasks',
      value: pendingCount,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      name: 'Failed Tasks',
      value: failedCount,
      icon: AlertCircle,
      color: 'text-error',
      bg: 'bg-error/10',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Welcome back, {session.user?.name || 'User'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-secondary">{stat.name}</p>
                  <p className="text-3xl font-bold text-text-primary mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-text-secondary">
              <li>Upload a document or enter text in the Documents section</li>
              <li>Configure your AI provider and MCP settings in Settings</li>
              <li>Process your document to extract task information</li>
              <li>Create tasks in your preferred project management tool</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

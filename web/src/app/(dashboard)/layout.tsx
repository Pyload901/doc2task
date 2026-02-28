import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileUp,
  CheckSquare, 
  Settings, 
  Users,
  LogOut,
  Server,
  MessageSquare,
  Key
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileUp },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  // { name: 'Settings', href: '/settings', icon: Settings },
];

const settingsNavigation = [
  { name: 'API Keys', href: '/settings/api-keys', icon: Key },
  { name: 'MCP Integrations', href: '/settings/mcp', icon: Server },
  { name: 'Prompts', href: '/settings/prompts', icon: MessageSquare },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: Users },
];

type SessionUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  const user = session.user as SessionUser;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <aside className="w-64 bg-surface border-r border-border flex flex-col">
          <div className="p-6 border-b border-border">
            <Link href="/" className="text-xl font-bold text-primary">
              Doc2Task
            </Link>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-gray-100 hover:text-text-primary transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}

            {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Settings
                  </p>
                </div>
                {settingsNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-gray-100 hover:text-text-primary transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
            
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Admin
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-lg hover:bg-gray-100 hover:text-text-primary transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {user?.role || 'USER'}
                </p>
              </div>
            </div>
            <form
              action={async () => {
                'use server';
                await signOut({ redirect: true, redirectTo: '/login' });
              }}
            >
              <Button variant="ghost" size="sm" className="w-full justify-start" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </form>
          </div>
        </aside>
        
        <main className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

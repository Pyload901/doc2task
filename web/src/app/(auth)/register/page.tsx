import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { RegisterForm } from '@/components/auth/register-form';
import prisma from '@/lib/prisma';

export default async function RegisterPage() {
  const session = await auth();
  
  if (session) {
    redirect('/');
  }

  const userCount = await prisma.user.count();
  
  if (userCount > 0) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Doc2Task</h1>
          <p className="text-text-secondary mt-2">AI-Powered Document to Task Converter</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = session.user.role as string;
  const userEmail = session.user.email;

  // Admin redirige al dashboard de admin
  if (userRole === 'ADMIN' || userEmail === 'dantekein90151@gmail.com') {
    redirect('/admin/dashboard');
  }

  // Líder redirige al dashboard de líder
  if (userRole === 'LEADER') {
    redirect('/leader/dashboard');
  }

  // Agente redirige al dashboard de agente
  redirect('/agent/dashboard');
}

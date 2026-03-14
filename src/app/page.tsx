import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Redirigir según el rol
  if (session.user.role === 'LEADER' || session.user.role === 'ADMIN') {
    redirect('/leader/dashboard');
  } else {
    redirect('/agent/dashboard');
  }
}

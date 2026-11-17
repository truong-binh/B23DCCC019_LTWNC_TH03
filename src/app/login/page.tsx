import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { auth } from '@/auth';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session?.user) redirect('/');

  const { callbackUrl } = await searchParams;

  return (
    <section>
      <h1>Đăng nhập</h1>
      <LoginForm callbackUrl={callbackUrl ?? '/loans'} />
    </section>
  );
}

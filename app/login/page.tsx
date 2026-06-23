'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setLoading(false);
      setError(signInError?.message ?? 'Login failed');
      return;
    }

    const { data: profile } = await supabase
      .from('user')
      .select('role')
      .eq('auth_id', data.user.id)
      .single();

    setLoading(false);

    const redirectTo = searchParams.get('redirectTo');
    if (redirectTo) {
      router.push(redirectTo);
      return;
    }

    switch (profile?.role) {
      case 'admin':
        router.push('/admin/dashboard');
        break;
      case 'visitor':
        router.push('/visitor/dashboard');
        break;
      default:
        router.push('/customer/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-8 space-y-5"
      >
        <h1 className="text-2xl font-bold text-center text-zinc-900 dark:text-white">
          Log in to Daily Vistory
        </h1>

        <div>
          <label className="block text-sm font-medium mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log In'}
        </button>

        {error && <p className="text-sm text-red-600">❌ {error}</p>}

        <p className="text-sm text-center text-zinc-500">
          No account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}

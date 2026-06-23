'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';

function LoginForm() {
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
    <div className="w-full max-w-sm">
      {/* Brand mark */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
          <span className="text-2xl">📰</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Log in to <span className="font-semibold text-violet-600 dark:text-violet-400">Daily Vistory</span>
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 border border-zinc-200/70 dark:border-zinc-800 p-8 space-y-5"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">✉️</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">🔒</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Logging in…
            </span>
          ) : (
            'Log In'
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
        </div>

        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
  No account?{' '}
  <a href="/signup" className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors">
    Sign up
  </a>
</p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-4">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/30 dark:bg-fuchsia-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl" />

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
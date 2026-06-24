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
    <div className="w-full max-w-sm animate-rise">
      {/* Masthead */}
      <div className="flex flex-col items-center mb-9">
        <div className="flex items-center gap-2 mb-3">
          <span className="block w-8 h-[2px] bg-orange-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-500">
            Est. Daily
          </span>
          <span className="block w-8 h-[2px] bg-orange-500" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-white tracking-tight">
          Daily Vistory
        </h1>
        <p className="text-sm text-zinc-500 mt-2 tracking-wide">
          Sign in to read today&rsquo;s edition
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-zinc-950 border border-zinc-800 rounded-none p-8 space-y-5 relative"
      >
        <span className="absolute top-0 left-0 w-full h-[3px] bg-orange-500" />

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-sm border border-zinc-700 bg-black text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orang..."
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-400 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 rounded-sm border border-zinc-700 bg-black text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-oran..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-sm bg-orange-500 text-black font-semibold uppercase tracking-wide text-sm hover:bg-orange-400 active:bg-orange-600 disabled:opacity-50 transition-colors d..."
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Logging in…
            </span>
          ) : (
            'Log In'
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 text-sm text-orange-400 bg-orange-950/30 border border-orange-900/60 rounded-sm px-3 py-2 animate-fade-in">
            <span className="font-bold">!</span>
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-800" />

        <p className="text-sm text-center text-zinc-500">
          No account?{' '}
          <a
            href="/signup"
            className="font-semibold text-orange-500 hover:text-orange-400 underline underline-offset-2 transition-colors"
          >
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <style jsx global>{`
        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-rise {
          animation: rise 0.5s ease-out both;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-rise,
          .animate-fade-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/client';
import type { UserRole } from '@/src/types/database';

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  address: string;
  lat: string;
  long: string;
  jobType: string;
  gender: string;
}

const initialForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'customer',
  address: '',
  lat: '',
  long: '',
  jobType: '',
  gender: 'male',
};

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ text: '❌ Geolocation not supported by your browser', ok: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
        setMessage({ text: '✅ Location detected', ok: true });
      },
      () => {
        setMessage({ text: '❌ Unable to get location. Check permissions.', ok: false });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const parsedLat = form.lat ? parseFloat(form.lat) : null;
    const parsedLong = form.long ? parseFloat(form.long) : null;

    if ((form.lat && Number.isNaN(parsedLat)) || (form.long && Number.isNaN(parsedLong))) {
      setLoading(false);
      setMessage({ text: '❌ Latitude/Longitude must be valid numbers', ok: false });
      return;
    }

    // 1. Create the Supabase Auth user (handles password hashing securely).
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setMessage({ text: `❌ ${authError?.message ?? 'Signup failed'}`, ok: false });
      return;
    }

    // 2. Create the matching profile row in public.user.
    const { error: profileError } = await supabase.from('user').insert({
      auth_id: authData.user.id,
      name: form.name,
      email: form.email,
      role: form.role,
      address: form.address || null,
      lat: parsedLat,
      long: parsedLong,
      job_type: form.jobType || null,
      gender: form.gender || null,
    });

    setLoading(false);

    if (profileError) {
      setMessage({ text: `❌ ${profileError.message}`, ok: false });
      return;
    }

    setMessage({ text: '✅ Account created! ', ok: true });
    setForm(initialForm);
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/30 dark:bg-fuchsia-600/20 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
            <span className="text-2xl">📰</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Join <span className="font-semibold text-violet-600 dark:text-violet-400">Daily Vistory</span> today
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-zinc-900/10 dark:shadow-black/40 border border-zinc-200/70 dark:border-zinc-800 p-8 space-y-5"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">🧑</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Email *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">✉️</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">🔒</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="customer">Customer</option>
              <option value="visitor">Visitor (Service Provider)</option>
            </select>
          </div>

          {form.role === 'visitor' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
                Job Type
              </label>
              <input
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                placeholder="e.g. Milkman, Grocer, Delivery"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Physical Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="House #, Street, Area, City"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Lat / Long inputs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1.5">
              Location Coordinates
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                name="lat"
                placeholder="Latitude"
                value={form.lat}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              <input
                type="number"
                step="any"
                name="long"
                placeholder="Longitude"
                value={form.long}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-2.5 px-3 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 border border-violet-200 dark:border-violet-900 rounded-xl transition-all"
            >
              📍 Use my current location
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:scale-100 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          {message && (
            <div
              className={`flex items-start gap-2 text-sm rounded-xl px-3 py-2 border ${
                message.ok
                  ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900'
                  : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
              }`}
            >
              <span>{message.text}</span>
            </div>
          )}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
          </div>

          <p className="text-sm text-center text-zinc-500 dark:text-zinc-400">
  Already have an account?{' '}
  <a href="/login" className="font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline transition-colors">
    Login
  </a>
</p>
        </form>
      </div>
    </div>
  );
}
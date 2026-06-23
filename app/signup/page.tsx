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
      lat: form.lat ? parseFloat(form.lat) : null,
      long: form.long ? parseFloat(form.long) : null,
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-zinc-900 dark:text-white mb-6">
          Create your Daily Vistory account
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-8 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
            >
              <option value="customer">Customer</option>
              <option value="visitor">Visitor (Service Provider)</option>
            </select>
          </div>

          {form.role === 'visitor' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Job Type</label>
              <input
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                placeholder="e.g. Milkman, Grocer, Delivery"
                className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Gender</label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Physical Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="House #, Street, Area, City"
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-zinc-700 resize-none"
            />
          </div>

          {/* Lat / Long inputs */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Location Coordinates (Lat/Long)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                step="any"
                name="lat"
                placeholder="Latitude"
                value={form.lat}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border rounded-lg dark:bg-zinc-700"
              />
              <input
                type="number"
                step="any"
                name="long"
                placeholder="Longitude"
                value={form.long}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 border rounded-lg dark:bg-zinc-700"
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-2 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-all"
            >
              📍 Use my current location
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>

          {message && (
            <p className={`text-sm font-medium ${message.ok ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
          
        <p className="text-sm text-center text-zinc-500">
          Already an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
        </form>
      </div>
    </div>
  );
}
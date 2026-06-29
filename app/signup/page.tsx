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
      setMessage({ text: 'Geolocation not supported by your browser', ok: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        }));
        setMessage({ text: 'Location detected', ok: true });
      },
      () => {
        setMessage({ text: 'Unable to get location. Check permissions.', ok: false });
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
      setMessage({ text: 'Latitude/Longitude must be valid numbers', ok: false });
      return;
    }

    // 1. Create the Supabase Auth user (handles password hashing securely).
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setMessage({ text: authError?.message ?? 'Signup failed', ok: false });
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
      setMessage({ text: profileError.message, ok: false });
      return;
    }

    setMessage({ text: 'Account created. Redirecting to login…', ok: true });
    setForm(initialForm);
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Masthead-style background texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 27px, #f97316 27px, #f97316 28px)',
        }}
      />
      <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-orange-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-[90px]" />

      <div className="w-full max-w-md relative z-10">
        {/* Masthead */}
        <div className="text-center mb-8 border-b-4 border-orange-500 pb-5">
          <p className="text-[11px] font-bold tracking-[0.3em] text-orange-500 uppercase mb-1">
            Edition No. 01
          </p>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase">
            Daily Vistory
          </h1>
          <p className="text-xs text-zinc-500 mt-2 tracking-wide">
            Register for full access — front page and beyond
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-zinc-950 border border-zinc-800 rounded-none p-8 space-y-5 shadow-[0_0_40px_-10px_rgba(249,115,22,0.25)]"
        >
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Your full name"
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Role
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
            >
              <option value="customer">Customer</option>
              <option value="visitor">Visitor (Service Provider)</option>
            </select>
          </div>

          {form.role === 'visitor' && (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
                Job Type
              </label>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
              >
                <option value="">Select job type</option>
                <option value="milkman">Milkman</option>
                <option value="grocer">Grocer</option>
                <option value="delivery">Delivery</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Gender
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
              Physical Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              placeholder="House #, Street, Area, City"
              className="w-full px-3.5 py-2.5 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm resize-none"
            />
          </div>

          {/* Lat / Long inputs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-orange-500 mb-1.5">
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
                className="w-1/2 px-3 py-2 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
              />
              <input
                type="number"
                step="any"
                name="long"
                placeholder="Longitude"
                value={form.long}
                onChange={handleChange}
                className="w-1/2 px-3 py-2 bg-black border border-zinc-700 text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors rounded-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              className="w-full py-2.5 px-3 text-sm font-bold uppercase tracking-wide text-orange-400 bg-orange-950/30 hover:bg-orange-900/40 border border-orange-700/50 rounded-sm transition-colors"
            >
              Use my current location
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-black font-black uppercase tracking-wide text-sm rounded-sm shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] disabled:opacity-50 transition-colors duration-150"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creating account…
              </span>
            ) : (
              'Sign Up'
            )}
          </button>

          {message && (
            <div
              className={`text-sm px-3 py-2 border-l-4 ${
                message.ok
                  ? 'text-orange-300 bg-orange-950/30 border-orange-500'
                  : 'text-red-400 bg-red-950/30 border-red-500'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-sm text-center text-zinc-500">
              Already have an account?{' '}
              <a
                href="/login"
                className="font-bold text-orange-500 hover:text-orange-400 hover:underline transition-colors"
              >
                Log in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

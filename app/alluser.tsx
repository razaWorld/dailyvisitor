'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  address: string | null;
  lat: number | null;
  long: number | null;
  jobType: string | null;
  gender: string;
  created_at?: string;
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      setError(error.message);
      setUsers([]);
    } else {
      setUsers(data as User[]);
    }

    setLoading(false);
  };

  const roleStyles: Record<string, string> = {
    admin: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-900',
    customer: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900',
    visitor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 px-4 py-10">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">All Users</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{users.length} total accounts</p>
          </div>
          <button
            onClick={fetchUsers}
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
            Loading users…
          </p>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2 mb-4">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No users found.</p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-zinc-900/5 dark:shadow-black/30 border border-zinc-200/70 dark:border-zinc-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Job Type</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Lat</th>
                  <th className="px-4 py-3">Long</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-zinc-200/70 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full border ${
                          roleStyles[user.role] ??
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{user.jobType ?? '-'}</td>
                    <td className="px-4 py-3">{user.address ?? '-'}</td>
                    <td className="px-4 py-3 capitalize">{user.gender ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{user.lat ?? '-'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{user.long ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
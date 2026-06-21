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
  gender:string ;
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            All Users
          </h1>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="text-zinc-500 dark:text-zinc-400">Loading users...</p>
        )}

        {error && (
          <p className="text-red-600 dark:text-red-400 mb-4">❌ {error}</p>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">No users found.</p>
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto bg-white dark:bg-zinc-900 rounded-xl shadow border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
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
                    className="border-t border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <td className="px-4 py-3">{user.id}</td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3 capitalize">{user.jobType ?? ''}</td>
                    <td className="px-4 py-3">{user.address ?? '-'}</td>
                    <td className="px-4 py-3">{user.gender ?? '-'}</td>
                    <td className="px-4 py-3">{user.lat ?? '-'}</td>
                    <td className="px-4 py-3">{user.long ?? '-'}</td>
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
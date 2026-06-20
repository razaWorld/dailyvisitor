'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase directly inside this file using your .env.local variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  address: string | null;
  lat: number | null;
  long: number | null;
  created_at: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'visitor',
    address: '',
    lat: '',
    long: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState<UserData[]>([]); // To store our users list

  // Function to fetch users from Supabase
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .order('id', { ascending: false }); // Show newest users first

    if (!error && data) {
      setUsers(data);
    }
  };

  // Fetch users automatically when the page loads
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude.toString(),
          long: position.coords.longitude.toString(),
        });
      },
      (error) => {
        alert('Unable to retrieve location. Please check your browser permissions.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('user')
      .insert([
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          address: formData.address || null,
          lat: formData.lat ? parseFloat(formData.lat) : null,
          long: formData.long ? parseFloat(formData.long) : null,
        },
      ]);

    setLoading(false);

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage('✅ Registered successfully inside your Supabase database!');
      setFormData({ name: '', email: '', password: '', role: 'visitor', address: '', lat: '', long: '' });
      fetchUsers(); // Refresh the users list immediately after a successful registration
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-zinc-50 font-sans dark:bg-black py-12 px-4 gap-8">
      
      {/* Registration Form Box */}
      <main className="flex w-full max-w-md flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="mb-6">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-zinc-50 mb-2">
          Create an Account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">
          Fill out your details to sign up directly to Supabase.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Email Address *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Account Role</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="visitor">Visitor</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Physical Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">Location Coordinates</label>
            <div className="flex gap-2 mb-2">
              <input type="number" step="any" name="lat" placeholder="Latitude" value={formData.lat} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none" />
              <input type="number" step="any" name="long" placeholder="Longitude" value={formData.long} onChange={handleChange} className="w-1/2 px-3 py-2 border rounded-lg text-black dark:text-white bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 focus:outline-none" />
            </div>
            <button type="button" onClick={handleGetLocation} className="w-full py-2 px-3 text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-all flex items-center justify-center gap-1">
              📍 Auto-Detect GPS Coordinates
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-2 py-2 px-4 rounded-full bg-black text-white dark:bg-white dark:text-black font-semibold hover:opacity-90 transition-all disabled:opacity-50">
            {loading ? 'Registering...' : 'Register User'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm font-medium text-center p-2 rounded bg-zinc-100 dark:bg-zinc-800 w-full text-black dark:text-white">
            {message}
          </p>
        )}
      </main>

      {/* Registered Users List Grid View */}
      <section className="w-full max-w-2xl bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black dark:text-zinc-50">Registered Users ({users.length})</h2>
          <button onClick={fetchUsers} className="text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-3 py-1 rounded-md text-black dark:text-white hover:bg-zinc-200 transition-all">
            🔄 Refresh List
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-4">No users found in database yet.</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {users.map((u) => (
              <div key={u.id} className="p-4 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm flex flex-col sm:flex-row sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-black dark:text-white text-base">{u.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                      {u.role}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-1">{u.email}</p>
                  {u.address && <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-xs">📍 {u.address}</p>}
                </div>
                <div className="text-left sm:text-right text-xs text-zinc-400 self-start sm:self-center">
                  {u.lat && u.long && (
                    <p className="font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                      {parseFloat(u.lat.toString()).toFixed(4)}, {parseFloat(u.long.toString()).toFixed(4)}
                    </p>
                  )}
                  <p>{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
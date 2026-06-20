'use client';

import { useState } from 'react';
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase directly inside this file using your .env.local variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

    // Sending data straight to your custom "user" table
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
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black py-12 px-4">
      <main className="flex w-full max-w-md flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800">
        
        {/* Next.js Logo */}
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

        {/* Form Container */}
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

        {/* Success/Error Message Display */}
        {message && (
          <p className="mt-4 text-sm font-medium text-center p-2 rounded bg-zinc-100 dark:bg-zinc-800 w-full text-black dark:text-white">
            {message}
          </p>
        )}

      </main>
    </div>
  );
}
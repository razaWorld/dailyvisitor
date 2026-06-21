'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  city: string;
  lat: string;
  long: string;
  jobtype: string;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  password: '',
  role: 'visitor',
  city: '',
  lat: '',
  long: '',
  jobtype: '',
};

type MessageType = 'success' | 'error' | '';

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: MessageType }>({
    text: '',
    type: '',
  });
  const [mapVisible, setMapVisible] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ text: '❌ Geolocation not supported by your browser', type: 'error' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const long = position.coords.longitude.toString();
        setFormData((prev) => ({ ...prev, lat, long }));
        setMessage({ text: `✅ Location detected: ${lat}, ${long}`, type: 'success' });
      },
      () => {
        setMessage({ text: '❌ Unable to get location. Check permissions.', type: 'error' });
      }
    );
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapVisible) return;

    const img = e.currentTarget.querySelector('img');
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const long = x * 360 - 180;
    const lat = (1 - y) * 180 - 90;

    setFormData((prev) => ({
      ...prev,
      lat: lat.toString(),
      long: long.toString(),
    }));
    setMessage({
      text: `✅ Map point selected: ${lat.toFixed(4)}, ${long.toFixed(4)}`,
      type: 'success',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    const { error } = await supabase.from('user').insert([
      {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        address: formData.city || null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        long: formData.long ? parseFloat(formData.long) : null,
        jobtype: formData.jobtype || null,
      },
    ]);

    setLoading(false);

    if (error) {
      setMessage({ text: `❌ ${error.message}`, type: 'error' });
      return;
    }

    setMessage({ text: '✅ Successfully registered for Daily_visitor_Mobile!', type: 'success' });
    setFormData(initialFormData);
    setMapVisible(false);
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/next.svg"
            alt="Daily_visitor_Mobile"
            width={120}
            height={30}
            className="dark:invert mx-auto mb-4"
            priority
          />
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            Daily_visitor_Mobile
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Create your account to start visiting
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Account Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="visitor">Visitor</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Job Type
              </label>
              <select
                name="jobtype"
                value={formData.jobtype}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select job type</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="freelance">Freelance</option>
                <option value="contract">Contract</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* City / Text Address */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                City / Area Name
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Rawalpindi, Karachi, Lahore"
                className="w-full px-4 py-2.5 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location with Map */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Location Coordinates (Lat/Long)
              </label>

              <div className="flex gap-2 mb-2">
                <input
                  type="number"
                  step="any"
                  name="lat"
                  placeholder="Latitude"
                  value={formData.lat}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="number"
                  step="any"
                  name="long"
                  placeholder="Longitude"
                  value={formData.long}
                  onChange={handleChange}
                  className="w-1/2 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg text-zinc-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="w-1/2 py-2 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  📍 GPS Auto-Detect
                </button>
                <button
                  type="button"
                  onClick={() => setMapVisible((prev) => !prev)}
                  className="w-1/2 py-2 px-3 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  🗺️ {mapVisible ? 'Hide Map' : 'Open Map'}
                </button>
              </div>

              {mapVisible && (
                <div
                  className="relative w-full h-64 rounded-lg overflow-hidden cursor-pointer border-2 border-blue-500 shadow-lg"
                  onClick={handleMapClick}
                >
                  {/* World Map Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.jpg"
                    alt="World Map"
                    className="w-full h-full object-cover"
                    draggable={false}
                  />

                  {/* Click Indicator */}
                  <div className="absolute top-2 left-2 bg-blue-700/80 text-white text-xs font-medium px-2 py-1 rounded">
                    📍 Click on map
                  </div>

                  {/* Selected Point Marker */}
                  {formData.lat && formData.long && (
                    <div
                      className="absolute w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{
                        left: `calc(${((parseFloat(formData.long) + 180) / 360) * 100}% - 10px)`,
                        top: `calc(${((90 - parseFloat(formData.lat)) / 180) * 100}% - 10px)`,
                      }}
                    />
                  )}
                </div>
              )}

              {mapVisible && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  💡 Click on the map to select your location coordinates
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Message */}
          {message.text && (
            <div
              className={`mt-6 p-4 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
          © 2026 Daily_visitor_Mobile. All rights reserved.
        </p>
      </div>
    </div>
  );
}
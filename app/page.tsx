'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const slides = [
  {
    icon: '🥛',
    title: 'Daily Essentials, Delivered',
    description: 'Order milk, eggs, fruits, and more from trusted providers near you.',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop',
  },
  {
    icon: '📍',
    title: 'Find Nearby Providers',
    description: 'Discover available visitors in your area with real-time location matching.',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    icon: '✅',
    title: 'Verified & Reliable',
    description: 'Every provider is approved by our admin team before they can serve you.',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop',
  },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen h-screen relative overflow-hidden flex flex-col">
      {/* Full-bleed background slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className={`w-full h-full object-cover transition-transform duration-[4500ms] ${
              i === active ? 'scale-110' : 'scale-100'
            }`}
          />
        </div>
      ))}

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-violet-950/50 via-transparent to-indigo-950/30" />

      {/* Floating decorative icons */}
      <span className="absolute top-[14%] left-[8%] text-4xl opacity-40 animate-float-slow select-none drop-shadow-lg">🥚</span>
      <span className="absolute top-[22%] right-[10%] text-4xl opacity-40 animate-float select-none drop-shadow-lg">🍎</span>
      <span className="absolute bottom-[30%] left-[12%] text-4xl opacity-40 animate-float-slow select-none drop-shadow-lg">🚲</span>
      <span className="absolute bottom-[40%] right-[14%] text-4xl opacity-40 animate-float select-none drop-shadow-lg">🛒</span>

      {/* Top bar */}
      <div
        className={`relative z-10 flex items-center justify-center gap-2 pt-8 pb-2 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-lg shadow-lg">
          📰
        </div>
        <span className="text-lg font-bold text-white tracking-tight drop-shadow-md">Daily Vistory</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="max-w-md w-full text-center">
          <div
            className={`bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-7 transition-all duration-700 ${
              mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="relative h-28">
              {slides.map((slide, i) => (
                <div
                  key={slide.title}
                  className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-500 ${
                    i === active
                      ? 'opacity-100 translate-x-0'
                      : i < active
                      ? 'opacity-0 -translate-x-6'
                      : 'opacity-0 translate-x-6'
                  }`}
                >
                  <span className="text-3xl drop-shadow-md">{slide.icon}</span>
                  <h2 className="text-lg font-semibold text-white drop-shadow-md">{slide.title}</h2>
                  <p className="text-sm text-white/80 max-w-sm">{slide.description}</p>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-3 mb-6">
              {slides.map((slide, i) => (
                <button
                  key={slide.title}
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? 'w-6 bg-white' : 'w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/signup"
                className="flex-1 px-5 py-3 rounded-xl bg-white text-zinc-900 font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold hover:bg-white/20 transition-all duration-200"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer dummy links */}
      <div
        className={`relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-6 px-4 text-xs text-white/70 transition-all duration-700 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Link href="#" className="hover:text-white transition-colors">About</Link>
        <Link href="#" className="hover:text-white transition-colors">How it works</Link>
        <Link href="#" className="hover:text-white transition-colors">Become a provider</Link>
        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
        <Link href="#" className="hover:text-white transition-colors">Contact</Link>
        <span>· © 2026 Daily Vistory</span>
      </div>

      <style>{`
        @keyframes float-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes float-up-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(6deg); }
        }
        .animate-float { animation: float-up 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-up-slow 8s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
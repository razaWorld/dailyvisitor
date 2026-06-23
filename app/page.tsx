import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950 px-4">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Daily Vistory</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Order daily essentials — milk, eggs, fruits, and more — from trusted nearby providers.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/signup" className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">
            Get Started
          </Link>
          <Link href="/login" className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 rounded-lg font-semibold">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

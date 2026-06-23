import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ count: customerCount }, { count: visitorCount }, { count: pendingVisitors }, { count: orderCount }] =
    await Promise.all([
      supabase.from('user').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('user').select('*', { count: 'exact', head: true }).eq('role', 'visitor'),
      supabase.from('visitor_profile').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
    ]);

  const stats = [
    { label: 'Customers', value: customerCount ?? 0, icon: '👥', accent: 'from-indigo-500 to-violet-500' },
    { label: 'Visitors', value: visitorCount ?? 0, icon: '🚶', accent: 'from-violet-500 to-fuchsia-500' },
    { label: 'Pending Approvals', value: pendingVisitors ?? 0, icon: '⏳', accent: 'from-amber-500 to-orange-500' },
    { label: 'Total Orders', value: orderCount ?? 0, icon: '📦', accent: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Decorative background blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Overview of platform activity</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-black/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.accent} flex items-center justify-center text-base shadow-md mb-3`}
              >
                {s.icon}
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {s.label}
              </p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
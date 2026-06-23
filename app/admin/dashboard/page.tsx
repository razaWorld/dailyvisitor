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
    { label: 'Customers', value: customerCount ?? 0 },
    { label: 'Visitors', value: visitorCount ?? 0 },
    { label: 'Pending Approvals', value: pendingVisitors ?? 0 },
    { label: 'Total Orders', value: orderCount ?? 0 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">{s.label}</p>
            <p className="text-3xl font-bold text-zinc-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

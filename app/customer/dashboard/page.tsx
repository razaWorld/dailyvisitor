import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CustomerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('user').select('*').eq('auth_id', user.id).single();
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at')
    .eq('customer_id', profile?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Welcome, {profile?.name ?? 'Customer'}
        </h1>
        <Link href="/customer/nearby" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          Find providers near me
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
        {!orders?.length && <p className="text-sm text-zinc-500">No orders yet.</p>}
        <div className="space-y-2">
          {orders?.map((o) => (
            <div key={o.id} className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between">
              <span>Order #{o.id}</span>
              <span className="capitalize text-sm text-zinc-500">{o.status}</span>
              <span>Rs. {o.total_amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

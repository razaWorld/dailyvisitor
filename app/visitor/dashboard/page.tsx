import { createClient } from '@/src/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function VisitorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('user').select('*').eq('auth_id', user.id).single();
  const { data: visitorProfile } = await supabase
    .from('visitor_profile')
    .select('*')
    .eq('user_id', profile?.id)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_amount, created_at')
    .eq('visitor_id', visitorProfile?.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Welcome, {profile?.name ?? 'Visitor'}
      </h1>

      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Account status</p>
        <p className="text-lg font-semibold capitalize">{visitorProfile?.status ?? 'pending'}</p>
        {visitorProfile?.status !== 'approved' && (
          <p className="text-xs text-amber-600 mt-1">
            Your account is awaiting admin approval before you can receive orders.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Incoming Orders</h2>
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

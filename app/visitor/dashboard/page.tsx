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

  const status = visitorProfile?.status ?? 'pending';

  const statusStyles: Record<string, string> = {
    approved: 'from-emerald-500 to-teal-500',
    pending: 'from-amber-500 to-orange-500',
    rejected: 'from-red-500 to-rose-500',
  };

  const orderStatusStyles: Record<string, string> = {
    pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
    completed: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
    cancelled: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900',
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-fuchsia-400/20 dark:bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Welcome, {profile?.name ?? 'Visitor'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Here is your provider account overview</p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-lg shadow-zinc-900/5 dark:shadow-black/30">
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${statusStyles[status] ?? statusStyles.pending} flex items-center justify-center text-base shadow-md`}
            >
              {status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳'}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Account status
              </p>
              <p className="text-lg font-semibold capitalize text-zinc-900 dark:text-white">{status}</p>
            </div>
          </div>
          {status !== 'approved' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 pl-12">
              Your account is awaiting admin approval before you can receive orders.
            </p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">Incoming Orders</h2>

          {!orders?.length && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No orders yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {orders?.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/70 dark:border-zinc-800 shadow-md shadow-zinc-900/5 dark:shadow-black/30 flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                <span className="font-medium text-zinc-900 dark:text-white">Order #{o.id}</span>
                <span
                  className={`text-xs font-semibold capitalize px-2.5 py-1 rounded-full border ${
                    orderStatusStyles[o.status] ??
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {o.status}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-white">Rs. {o.total_amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
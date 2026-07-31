import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { getDashboardSummary } from '../api/dashboard.api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';

interface Summary {
  totalCustomers: number;
  leadCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: { name: string; sku: string; currentStock: number; minStockAlert: number }[];
  draftChallans: number;
  confirmedChallans: number;
  recentChallans: { id: string; challanNumber: string; status: string; totalQuantity: number; customer: { name: string } }[];
  upcomingFollowUps: { id: string; name: string; followUpDate: string; mobile: string }[];
}

function StatCard({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-3xl font-extrabold mt-2 ${accent || 'text-ink'}`}>{value}</p>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader title={`Welcome back, ${user?.name?.split(' ')[0]}`} subtitle="Here's what's happening across your operations today." />

      {loading || !summary ? (
        <p className="text-slate-500 text-sm">Loading dashboard…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Customers" value={summary.totalCustomers} hint={`${summary.leadCustomers} leads to follow up`} />
            <StatCard label="Products Tracked" value={summary.totalProducts} />
            <StatCard label="Low Stock Alerts" value={summary.lowStockCount} accent={summary.lowStockCount > 0 ? 'text-alert-amber' : 'text-ink'} />
            <StatCard label="Open Draft Challans" value={summary.draftChallans} hint={`${summary.confirmedChallans} confirmed`} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink text-sm">Low Stock Products</h3>
                <Link to="/products" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
              </div>
              {summary.lowStockProducts.length === 0 ? (
                <p className="text-sm text-slate-400">All products are above their minimum stock level.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.lowStockProducts.slice(0, 6).map((p) => (
                    <li key={p.sku} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-slate-400 mono">{p.sku}</p>
                      </div>
                      <span className="badge bg-amber-100 text-amber-800">{p.currentStock} / min {p.minStockAlert}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-ink text-sm">Recent Sales Challans</h3>
                <Link to="/challans" className="text-xs font-semibold text-brand-600 hover:underline">View all</Link>
              </div>
              {summary.recentChallans.length === 0 ? (
                <p className="text-sm text-slate-400">No challans created yet.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.recentChallans.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="font-medium text-ink mono">{c.challanNumber}</p>
                        <p className="text-xs text-slate-400">{c.customer.name} · Qty {c.totalQuantity}</p>
                      </div>
                      <StatusBadge value={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {summary.upcomingFollowUps.length > 0 && (
            <div className="card p-5 mt-6">
              <h3 className="font-bold text-ink text-sm mb-4">Upcoming Customer Follow-ups</h3>
              <ul className="grid md:grid-cols-2 gap-2">
                {summary.upcomingFollowUps.map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-ink">{f.name}</span>
                    <span className="text-xs text-slate-500">{new Date(f.followUpDate).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

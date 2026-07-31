import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { Challan, listChallans } from '../../api/challans.api';
import { useAuth } from '../../context/AuthContext';

export default function ChallanList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Challan[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await listChallans({ status: (status as any) || undefined, limit: 50 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  const canCreate = hasRole('ADMIN', 'SALES');

  return (
    <Layout>
      <PageHeader
        title="Sales Challans"
        subtitle="Create, confirm, and track outgoing sales challans."
        actions={canCreate ? <button className="btn-primary" onClick={() => navigate('/challans/new')}>+ New Challan</button> : undefined}
      />

      <div className="flex gap-3 mb-4">
        <select className="input max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No challans found" message="Create a sales challan to record an outgoing shipment." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Challan #</th>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Total Qty</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3"><Link to={`/challans/${c.id}`} className="font-semibold mono text-brand-600 hover:underline">{c.challanNumber}</Link></td>
                  <td className="px-5 py-3 text-ink">{c.customer.name}</td>
                  <td className="px-5 py-3 text-slate-600">{c.totalQuantity}</td>
                  <td className="px-5 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}

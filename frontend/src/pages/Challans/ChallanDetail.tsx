import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { getChallan, changeChallanStatus, challanPdfUrl } from '../../api/challans.api';
import { extractErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ChallanDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      setChallan(await getChallan(id));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleStatus(newStatus: 'CONFIRMED' | 'CANCELLED') {
    if (!id) return;
    setError('');
    setUpdating(true);
    try {
      await changeChallanStatus(id, newStatus);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  if (loading || !challan) {
    return <Layout><p className="text-sm text-slate-500">Loading…</p></Layout>;
  }

  const canTransition = hasRole('ADMIN', 'SALES', 'WAREHOUSE');
  const grandTotal = challan.items.reduce((sum: number, it: any) => sum + Number(it.unitPriceSnapshot) * it.quantity, 0);

  return (
    <Layout>
      <Link to="/challans" className="text-xs font-semibold text-brand-600 hover:underline">&larr; Back to Challans</Link>

      <PageHeader
        title={challan.challanNumber}
        subtitle={`Created by ${challan.createdBy.name} on ${new Date(challan.createdAt).toLocaleString()}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={challan.status} />
            <a href={challanPdfUrl(challan.id)} target="_blank" rel="noreferrer" className="btn-secondary">Download PDF</a>
            {canTransition && challan.status === 'DRAFT' && (
              <button className="btn-primary" disabled={updating} onClick={() => handleStatus('CONFIRMED')}>Confirm & Deduct Stock</button>
            )}
            {canTransition && challan.status !== 'CANCELLED' && (
              <button className="btn-danger" disabled={updating} onClick={() => handleStatus('CANCELLED')}>Cancel Challan</button>
            )}
          </div>
        }
      />

      {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4">{error}</p>}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-ink text-sm mb-3">Customer</h3>
          <p className="font-semibold text-ink">{challan.customer.name}</p>
          {challan.customer.businessName && <p className="text-sm text-slate-500">{challan.customer.businessName}</p>}
          <p className="text-sm text-slate-500 mt-1">{challan.customer.mobile}</p>
          {challan.customer.address && <p className="text-sm text-slate-500">{challan.customer.address}</p>}
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-bold text-ink text-sm mb-3">Line Items</h3>
          <table className="w-full text-sm">
            <thead className="text-slate-500 text-xs uppercase tracking-wide border-b border-slate-200">
              <tr>
                <th className="text-left py-2 font-semibold">Product</th>
                <th className="text-left py-2 font-semibold">SKU</th>
                <th className="text-right py-2 font-semibold">Price</th>
                <th className="text-right py-2 font-semibold">Qty</th>
                <th className="text-right py-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((it: any) => (
                <tr key={it.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-ink">{it.productNameSnapshot}</td>
                  <td className="py-2 text-slate-500 mono">{it.productSkuSnapshot}</td>
                  <td className="py-2 text-right mono">₹{Number(it.unitPriceSnapshot).toFixed(2)}</td>
                  <td className="py-2 text-right">{it.quantity}</td>
                  <td className="py-2 text-right mono">₹{(Number(it.unitPriceSnapshot) * it.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end gap-6 mt-3 pt-3 border-t border-slate-200 text-sm">
            <p className="text-slate-500">Total Qty: <span className="font-semibold text-ink">{challan.totalQuantity}</span></p>
            <p className="text-slate-500">Grand Total: <span className="font-bold text-ink mono">₹{grandTotal.toFixed(2)}</span></p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

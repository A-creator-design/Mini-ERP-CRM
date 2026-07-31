import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { getCustomer, addCustomerNote, updateCustomer } from '../../api/customers.api';
import { extractErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCustomer(id);
      setCustomer(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !noteText.trim()) return;
    setSavingNote(true);
    setError('');
    try {
      await addCustomerNote(id, noteText.trim());
      setNoteText('');
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSavingNote(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!id) return;
    await updateCustomer(id, { status: newStatus as any });
    load();
  }

  if (loading || !customer) {
    return <Layout><p className="text-sm text-slate-500">Loading…</p></Layout>;
  }

  const canManage = hasRole('ADMIN', 'SALES');

  return (
    <Layout>
      <Link to="/customers" className="text-xs font-semibold text-brand-600 hover:underline">&larr; Back to Customers</Link>
      <PageHeader
        title={customer.name}
        subtitle={customer.businessName || customer.mobile}
        actions={
          canManage ? (
            <select className="input max-w-[160px]" value={customer.status} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          ) : undefined
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card p-5">
          <h3 className="font-bold text-ink text-sm mb-3">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Mobile</dt><dd className="font-medium">{customer.mobile}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium">{customer.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">GST</dt><dd className="font-medium">{customer.gstNumber || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Type</dt><dd><StatusBadge value={customer.customerType} /></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><StatusBadge value={customer.status} /></dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Follow-up</dt><dd className="font-medium">{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}</dd></div>
            <div className="pt-2 border-t border-slate-100"><dt className="text-slate-500 mb-1">Address</dt><dd className="font-medium">{customer.address || '—'}</dd></div>
          </dl>
        </div>

        <div className="card p-5 md:col-span-2">
          <h3 className="font-bold text-ink text-sm mb-3">Follow-up Notes</h3>
          {canManage && (
            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <input className="input" placeholder="Add a note about this customer…" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button className="btn-primary shrink-0" disabled={savingNote}>{savingNote ? 'Adding…' : 'Add Note'}</button>
            </form>
          )}
          {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
          {customer.notes.length === 0 ? (
            <p className="text-sm text-slate-400">No notes yet.</p>
          ) : (
            <ul className="space-y-3">
              {customer.notes.map((n: any) => (
                <li key={n.id} className="text-sm border-b border-slate-100 pb-3 last:border-0">
                  <p className="text-ink">{n.note}</p>
                  <p className="text-xs text-slate-400 mt-1">{n.createdBy.name} · {new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-bold text-ink text-sm mt-6 mb-3">Recent Challans</h3>
          {customer.challans.length === 0 ? (
            <p className="text-sm text-slate-400">No challans for this customer yet.</p>
          ) : (
            <ul className="space-y-2">
              {customer.challans.map((c: any) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link to={`/challans/${c.id}`} className="font-medium mono text-brand-600 hover:underline">{c.challanNumber}</Link>
                  <StatusBadge value={c.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}

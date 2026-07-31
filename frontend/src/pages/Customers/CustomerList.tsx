import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Customer, createCustomer, listCustomers } from '../../api/customers.api';
import { extractErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const emptyForm = {
  name: '', mobile: '', email: '', businessName: '', gstNumber: '',
  customerType: 'RETAIL' as const, address: '', status: 'LEAD' as const, followUpDate: '',
};

export default function CustomerList() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listCustomers({ search: search || undefined, status: (status as any) || undefined, limit: 50 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.followUpDate) delete payload.followUpDate;
      else payload.followUpDate = new Date(payload.followUpDate).toISOString();
      await createCustomer(payload);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canManage = hasRole('ADMIN', 'SALES');

  return (
    <Layout>
      <PageHeader
        title="Customers"
        subtitle="Manage leads, active accounts, and follow-ups."
        actions={canManage ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Customer</button> : undefined}
      />

      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search by name, mobile, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[160px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No customers found" message="Try adjusting your filters or add a new customer to get started." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Customer</th>
                <th className="text-left px-5 py-3 font-semibold">Contact</th>
                <th className="text-left px-5 py-3 font-semibold">Type</th>
                <th className="text-left px-5 py-3 font-semibold">Status</th>
                <th className="text-left px-5 py-3 font-semibold">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/customers/${c.id}`} className="font-semibold text-ink hover:text-brand-600">{c.name}</Link>
                    {c.businessName && <p className="text-xs text-slate-400">{c.businessName}</p>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <p>{c.mobile}</p>
                    {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3"><StatusBadge value={c.customerType} /></td>
                  <td className="px-5 py-3"><StatusBadge value={c.status} /></td>
                  <td className="px-5 py-3 text-slate-500">{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Add Customer" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Mobile *</label><input className="input" required value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Business Name</label><input className="input" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></div>
              <div><label className="label">GST Number</label><input className="input" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} /></div>
              <div>
                <label className="label">Customer Type</label>
                <select className="input" value={form.customerType} onChange={(e) => setForm({ ...form, customerType: e.target.value })}>
                  <option value="RETAIL">Retail</option>
                  <option value="WHOLESALE">Wholesale</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="LEAD">Lead</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div><label className="label">Follow-up Date</label><input className="input" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} /></div>
            </div>
            <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}

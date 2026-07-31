import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { Modal } from '../../components/Modal';
import { EmptyState } from '../../components/EmptyState';
import { Product, createProduct, listProducts, recordStockMovement } from '../../api/products.api';
import { extractErrorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', sku: '', category: '', unitPrice: 0, currentStock: 0, minStockAlert: 0, location: '' };

export default function ProductList() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await listProducts({ search: search || undefined, lowStock: lowStockOnly || undefined, limit: 50 });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowStockOnly]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createProduct({ ...form, unitPrice: Number(form.unitPrice), currentStock: Number(form.currentStock), minStockAlert: Number(form.minStockAlert) });
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const canManage = hasRole('ADMIN', 'WAREHOUSE');

  return (
    <Layout>
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage the product catalog and track stock movements."
        actions={canManage ? <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Product</button> : undefined}
      />

      <div className="flex gap-3 mb-4 items-center">
        <input className="input max-w-xs" placeholder="Search by name or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          Low stock only
        </label>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <EmptyState title="No products found" message="Try adjusting your filters or add a new product." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-5 py-3 font-semibold">Category</th>
                <th className="text-left px-5 py-3 font-semibold">Price</th>
                <th className="text-left px-5 py-3 font-semibold">Stock</th>
                <th className="text-left px-5 py-3 font-semibold">Location</th>
                {canManage && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const low = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-slate-400 mono">{p.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{p.category}</td>
                    <td className="px-5 py-3 text-slate-600 mono">₹{Number(p.unitPrice).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${low ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.currentStock} {low && '⚠'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{p.location || '—'}</td>
                    {canManage && (
                      <td className="px-5 py-3 text-right">
                        <button className="text-xs font-semibold text-brand-600 hover:underline" onClick={() => setMovementProduct(p)}>
                          Adjust Stock
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal title="Add Product" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">SKU *</label><input className="input" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><label className="label">Category *</label><input className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
              <div><label className="label">Unit Price *</label><input className="input" type="number" step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></div>
              <div><label className="label">Opening Stock</label><input className="input" type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} /></div>
              <div><label className="label">Min Stock Alert</label><input className="input" type="number" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: e.target.value })} /></div>
              <div className="col-span-2"><label className="label">Warehouse Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Product'}</button>
            </div>
          </form>
        </Modal>
      )}

      {movementProduct && (
        <StockMovementModal
          product={movementProduct}
          onClose={() => setMovementProduct(null)}
          onSaved={() => { setMovementProduct(null); load(); }}
        />
      )}
    </Layout>
  );
}

function StockMovementModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await recordStockMovement(product.id, Number(quantity), movementType, reason);
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Adjust Stock — ${product.name}`} onClose={onClose}>
      <p className="text-sm text-slate-500 mb-4">Current stock: <span className="font-semibold text-ink">{product.currentStock}</span></p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Movement Type</label>
            <select className="input" value={movementType} onChange={(e) => setMovementType(e.target.value as 'IN' | 'OUT')}>
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
          </div>
          <div><label className="label">Quantity</label><input className="input" type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
        </div>
        <div><label className="label">Reason *</label><input className="input" required placeholder="e.g. New purchase order, damaged goods, stock count correction" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Record Movement'}</button>
        </div>
      </form>
    </Modal>
  );
}

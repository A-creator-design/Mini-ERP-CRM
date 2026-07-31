import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { listCustomers, Customer } from '../../api/customers.api';
import { listProducts, Product } from '../../api/products.api';
import { createChallan } from '../../api/challans.api';
import { extractErrorMessage } from '../../api/client';

interface LineItem { productId: string; quantity: number; }

export default function ChallanCreate() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCustomers({ limit: 200 }).then((r) => setCustomers(r.items));
    listProducts({ limit: 200 }).then((r) => setProducts(r.items));
  }, []);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  }

  function removeRow(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function productFor(id: string) {
    return products.find((p) => p.id === id);
  }

  const total = items.reduce((sum, it) => {
    const p = productFor(it.productId);
    return sum + (p ? Number(p.unitPrice) * it.quantity : 0);
  }, 0);

  async function handleSubmit(status: 'DRAFT' | 'CONFIRMED') {
    setError('');
    const validItems = items.filter((it) => it.productId && it.quantity > 0);
    if (!customerId) return setError('Please select a customer.');
    if (validItems.length === 0) return setError('Add at least one product line.');

    setSaving(true);
    try {
      const challan = await createChallan(customerId, validItems, status);
      navigate(`/challans/${challan.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <PageHeader title="New Sales Challan" subtitle="Select a customer and add products for this shipment." />

      <div className="card p-6 max-w-3xl">
        <div className="mb-5">
          <label className="label">Customer *</label>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Select a customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>
            ))}
          </select>
        </div>

        <label className="label">Products</label>
        <div className="space-y-2 mb-3">
          {items.map((item, i) => {
            const p = productFor(item.productId);
            return (
              <div key={i} className="flex gap-2 items-start">
                <select className="input flex-1" value={item.productId} onChange={(e) => updateItem(i, { productId: e.target.value })}>
                  <option value="">Select product…</option>
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id}>{prod.name} ({prod.sku}) — stock: {prod.currentStock}</option>
                  ))}
                </select>
                <input
                  className="input w-24"
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                />
                <div className="w-24 text-right text-sm text-slate-500 pt-2.5 mono">
                  {p ? `₹${(Number(p.unitPrice) * item.quantity).toFixed(2)}` : '—'}
                </div>
                <button type="button" className="text-slate-400 hover:text-rose-600 px-2 pt-2" onClick={() => removeRow(i)}>&times;</button>
              </div>
            );
          })}
        </div>
        <button type="button" className="text-sm font-semibold text-brand-600 hover:underline" onClick={addRow}>+ Add another product</button>

        <div className="flex justify-end mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm font-bold text-ink">Estimated Total: <span className="mono">₹{total.toFixed(2)}</span></p>
        </div>

        {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-secondary" disabled={saving} onClick={() => handleSubmit('DRAFT')}>Save as Draft</button>
          <button className="btn-primary" disabled={saving} onClick={() => handleSubmit('CONFIRMED')}>{saving ? 'Saving…' : 'Confirm & Deduct Stock'}</button>
        </div>
      </div>
    </Layout>
  );
}

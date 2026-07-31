import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth.api';
import { extractErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEMO_LOGINS = [
  { role: 'Admin', email: 'admin@erp.com' },
  { role: 'Sales', email: 'sales@erp.com' },
  { role: 'Warehouse', email: 'warehouse@erp.com' },
  { role: 'Accounts', email: 'accounts@erp.com' },
];

export default function Login() {
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      setSession(result.token, result.user);
      navigate('/');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 p-10 text-white">
          <div>
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold text-lg mb-8">O</div>
            <h1 className="text-3xl font-extrabold leading-tight mb-3">OpsDesk</h1>
            <p className="text-brand-100 text-sm leading-relaxed">
              One workspace for customers, stock, and sales challans — built for wholesale and distribution teams.
            </p>
          </div>
          <div className="space-y-3 text-sm text-brand-100">
            <p>◍ Track leads through to active accounts</p>
            <p>▤ Real-time stock levels with low-stock alerts</p>
            <p>⎘ Draft → Confirm challans with automatic stock deduction</p>
          </div>
        </div>

        <div className="bg-white p-10">
          <h2 className="text-xl font-bold text-ink mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Use your role credentials to access the portal.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2">Demo credentials (password: Password@123)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_LOGINS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('Password@123');
                  }}
                  className="text-xs text-left px-2.5 py-2 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  <span className="font-semibold text-slate-700 block">{d.role}</span>
                  <span className="text-slate-400 mono">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

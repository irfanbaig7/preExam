'use client';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the payment window'));
    document.body.appendChild(s);
  });
}

export default function Premium() {
  const { user, setUser, loading } = useRequireAuth();
  const [cfg, setCfg] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/payments/config').then(setCfg).catch(() => {}); }, []);

  const pay = async () => {
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      if (!cfg.razorpay) {
        const d = await api('/payments/demo-activate', { method: 'POST' });
        setUser(d.user);
        setMsg({ type: 'ok', text: 'Premium is active (demo mode, no payment taken).' });
        return;
      }
      const order = await api('/payments/order', { method: 'POST' });
      await loadRazorpay();
      const rz = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'PYQ Analyzer',
        description: 'Premium, 30 days',
        prefill: { name: user.name, email: user.email },
        handler: async (r) => {
          try {
            const d = await api('/payments/verify', { method: 'POST', body: r });
            setUser(d.user);
            setMsg({ type: 'ok', text: 'Payment verified. Premium is active.' });
          } catch (e) { setMsg({ type: 'err', text: e.message }); }
        },
      });
      rz.open();
    } catch (e) { setMsg({ type: 'err', text: e.message }); }
    finally { setBusy(false); }
  };

  if (loading || !user || !cfg) return <p className="muted">Loading...</p>;

  return (
    <div className="panel" style={{ maxWidth: 560 }}>
      <h2>Premium</h2>
      <p>Rs {cfg.priceInr} for 30 days. Unlocks the day-by-day study plan on every subject.</p>
      {user.isPremium ? (
        <div className="alert ok">Premium is active{user.premiumUntil ? ` until ${new Date(user.premiumUntil).toLocaleDateString()}` : ''}.</div>
      ) : null}
      {msg.text && <div className={`alert ${msg.type}`} role="status">{msg.text}</div>}
      <button className="btn" onClick={pay} disabled={busy}>{busy ? 'Please wait...' : user.isPremium ? 'Extend by 30 days' : cfg.razorpay ? `Pay Rs ${cfg.priceInr}` : 'Activate Premium (demo)'}</button>
      {!cfg.razorpay && <p className="muted" style={{ marginTop: '.75rem' }}>Razorpay keys are not set on the server, so this button turns Premium on without payment. Add the keys in server/.env for real checkout.</p>}
    </div>
  );
}

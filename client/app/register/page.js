'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFields({});
    try {
      await register(form.name, form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
      setFields(err.details || {});
    } finally {
      setBusy(false);
    }
  };

  const input = (key, label, type = 'text', auto) => (
    <div className="field">
      <label htmlFor={key}>{label}</label>
      <input id={key} type={type} required autoComplete={auto} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      {fields[key] && <div className="field-error">{fields[key][0]}</div>}
    </div>
  );

  return (
    <div className="panel auth-box">
      <h2>Create your account</h2>
      {error && <div className="alert err" role="alert">{error}</div>}
      <form onSubmit={submit}>
        {input('name', 'Name', 'text', 'name')}
        {input('email', 'Email', 'email', 'email')}
        {input('password', 'Password (at least 8 characters)', 'password', 'new-password')}
        <button className="btn" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}>Already registered? <Link href="/login">Log in</Link></p>
    </div>
  );
}

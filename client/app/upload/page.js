'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';

function UploadForm() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subjectId: params.get('subject') || '', year: new Date().getFullYear(), examType: 'regular', text: '' });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) api('/subjects').then((d) => setSubjects(d.subjects)).catch(() => {}); }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('subjectId', form.subjectId);
      fd.append('year', form.year);
      fd.append('examType', form.examType);
      if (file) fd.append('file', file);
      else fd.append('text', form.text);
      await api('/papers', { method: 'POST', body: fd });
      router.push('/dashboard');
    } catch (err) {
      setError(err.details ? Object.values(err.details).flat().join(' ') : err.message);
    } finally { setBusy(false); }
  };

  if (loading || !user) return <p className="muted">Loading...</p>;
  const trusted = ['admin', 'contributor'].includes(user.role);

  return (
    <div className="panel" style={{ maxWidth: 640 }}>
      <h2>Upload a question paper</h2>
      <p className="muted">{trusted ? 'Your uploads are published right after processing.' : 'An admin reviews uploads before everyone can see them.'}</p>
      {error && <div className="alert err" role="alert">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="subject">Subject</label>
          <select id="subject" required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Choose a subject</option>
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
          </select></div>
        <div className="row">
          <div className="field"><label htmlFor="year">Exam year</label><input id="year" type="number" min="1990" max="2100" required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
          <div className="field"><label htmlFor="type">Exam type</label>
            <select id="type" value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })}><option value="regular">Regular</option><option value="backlog">Backlog</option></select></div>
        </div>
        <div className="field"><label htmlFor="file">PDF file (max 10 MB)</label><input id="file" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files[0] || null)} /></div>
        {!file && (
          <div className="field"><label htmlFor="text">Or paste the question text</label>
            <textarea id="text" placeholder={'Q1. Explain ... [7 marks]\nQ2. Write ...'} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <p className="muted" style={{ marginTop: '.3rem' }}>Questions should start with a number, like "1." or "Q1.". Use this for scanned PDFs.</p></div>
        )}
        <button className="btn" disabled={busy}>{busy ? 'Uploading...' : 'Upload paper'}</button>
      </form>
    </div>
  );
}

export default function UploadPage() {
  return <Suspense fallback={<p className="muted">Loading...</p>}><UploadForm /></Suspense>;
}

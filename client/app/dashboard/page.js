'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';

export default function Dashboard() {
  const { user, setUser, loading } = useRequireAuth();
  const [subjects, setSubjects] = useState([]);
  const [papers, setPapers] = useState([]);
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', university: '', semester: '' });
  const [error, setError] = useState('');
  const [examDate, setExamDate] = useState('');

  const loadSubjects = useCallback(async () => {
    const d = await api(`/subjects?q=${encodeURIComponent(q)}`);
    setSubjects(d.subjects);
  }, [q]);
  const loadPapers = useCallback(async () => setPapers((await api('/papers?mine=true')).papers), []);

  useEffect(() => { if (user) loadSubjects().catch(() => { }); }, [user, loadSubjects]);
  useEffect(() => { if (user) loadPapers().catch(() => { }); }, [user, loadPapers]);
  useEffect(() => { if (user && user.examDate) setExamDate(user.examDate.slice(0, 10)); }, [user]);

  // keep polling while a paper is still being processed in the background
  const working = papers.some((p) => ['queued', 'processing'].includes(p.status));
  useEffect(() => {
    if (!working) return;
    const t = setInterval(() => loadPapers().catch(() => { }), 3000);
    return () => clearInterval(t);
  }, [working, loadPapers]);

  const createSubject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, semester: form.semester || undefined };
      await api('/subjects', { method: 'POST', body });
      setForm({ name: '', code: '', university: '', semester: '' });
      setShowNew(false);
      loadSubjects();
    } catch (err) { setError(err.message); }
  };

  const toggleSub = async (id) => {
    await api(`/subjects/${id}/subscribe`, { method: 'POST' });
    loadSubjects();
  };

  const saveExam = async () => {
    const d = await api('/auth/me', { method: 'PATCH', body: { examDate: examDate || null } });
    setUser(d.user);
  };

  if (loading || !user) return <p className="muted">Loading...</p>;

  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Hi {user.name.split(' ')[0]}</h1>

      <div className="panel">
        <h2>Subjects</h2>
        <div className="row">
          <div><label htmlFor="q">Search subjects</label><input id="q" placeholder="Name, code or university" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <button className="btn ghost" onClick={() => setShowNew(!showNew)}>{showNew ? 'Cancel' : 'Add a subject'}</button>
        </div>
        {showNew && (
          <form onSubmit={createSubject} style={{ marginTop: '1rem' }}>
            {error && <div className="alert err" role="alert">{error}</div>}
            <div className="row">
              <div><label htmlFor="n">Subject name</label><input id="n" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label htmlFor="c">Code</label><input id="c" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><label htmlFor="u">University</label><input id="u" required value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} /></div>
              <div><label htmlFor="s">Semester</label><input id="s" type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
              <button className="btn">Save subject</button>
            </div>
          </form>
        )}
        <div className="grid" style={{ marginTop: '1rem' }}>
          {subjects.map((s) => (
            <div className="subject" key={s._id}>
              <h3><Link href={`/subjects/${s._id}`}>{s.name}</Link></h3>
              <span className="muted">{s.code}, {s.university}{s.semester ? `, semester ${s.semester}` : ''}</span>
              <label className="switch">
                <input type="checkbox" role="switch" checked={s.subscribed} onChange={() => toggleSub(s._id)} />
                <span className="slider" aria-hidden="true" />
                <span>{s.subscribed ? 'Alerts on for new papers' : 'Alerts off'}</span>
              </label>
            </div>
          ))}
          {subjects.length === 0 && <p className="muted">No subjects found. Add the first one, then upload its papers.</p>}
        </div>
      </div>

      <div className="panel">
        <h2>Exam date</h2>
        <p className="muted">Set it and you get a reminder with the most repeated topics in the last 7 days before it.</p>
        <div className="row">
          <div><label htmlFor="exam">Exam date</label><input id="exam" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
          <button className="btn ghost" onClick={saveExam}>Save date</button>
        </div>
      </div>

      <div className="panel">
        <h2>My uploads</h2>
        {papers.length === 0 ? (
          <p className="muted">You have not uploaded a paper yet. <Link href="/upload">Upload one</Link>.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Subject</th><th>Year</th><th>Processing</th><th>Review</th><th>Questions</th></tr></thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p._id}>
                    <td>{p.subject ? p.subject.name : ''}</td>
                    <td><Link href={`/papers/${p._id}`}>{p.year}</Link> {p.examType === 'backlog' ? '(backlog)' : ''}</td>                    <td><span className={`tag ${p.status}`}>{p.status}</span>{p.failReason && <div className="field-error">{p.failReason}</div>}</td>
                    <td><span className={`tag ${p.moderation}`}>{p.moderation}</span></td>
                    <td>{p.questionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

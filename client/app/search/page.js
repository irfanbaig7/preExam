'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';

function Highlight({ text, q }) {
  const terms = q.split(/\s+/).filter((t) => t.length > 1).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.join('|')})`, 'gi');
  return text.split(re).map((part, i) => (re.test(part) && i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

export default function SearchPage() {
  const { user, loading } = useRequireAuth();
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState('');

  const run = async (page = 1) => {
    if (q.trim().length < 2) return;
    setBusy(true);
    setError('');
    try {
      setData(await api(`/search?q=${encodeURIComponent(q.trim())}&page=${page}`));
      setAsked(q.trim());
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (loading || !user) return <p className="muted">Loading...</p>;

  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Search questions</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); run(1); }} style={{ marginBottom: '1.25rem' }}>
        <div><label htmlFor="q">Topic or keyword</label><input id="q" placeholder="for example: quick sort" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button className="btn" disabled={busy}>{busy ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <div className="alert err">{error}</div>}
      {data && (
        <div className="panel">
          <p className="muted">{data.total} matching question{data.total === 1 ? '' : 's'}</p>
          {data.results.map((r) => (
            <div className="q" key={r._id}>
              <Highlight text={r.text} q={asked} /><br />
              <small>{r.year}{r.marks ? `, ${r.marks} marks` : ''}, topic {r.topic}, <Link href={`/subjects/${r.subject._id}`}>{r.subject.name}</Link></small>
            </div>
          ))}
          {data.pages > 1 && (
            <div className="row" style={{ marginTop: '1rem' }}>
              <button className="btn ghost" disabled={data.page <= 1} onClick={() => run(data.page - 1)}>Previous</button>
              <span className="muted">Page {data.page} of {data.pages}</span>
              <button className="btn ghost" disabled={data.page >= data.pages} onClick={() => run(data.page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

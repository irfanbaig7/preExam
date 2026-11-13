'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useRequireAuth } from '../../../lib/auth-context';

export default function PaperPage({ params }) {
    const { user, loading } = useRequireAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const load = () => api(`/papers/${params.id}`).then(setData).catch((e) => setError(e.message));
    useEffect(() => { if (user) load(); }, [user, params.id]); // eslint-disable-line

    const retag = async () => {
        setError(''); setMsg('');
        try {
            await api(`/admin/papers/${params.id}/reprocess`, { method: 'POST' });
            setMsg('Re-tagging started. Questions refresh in a few seconds.');
            setTimeout(load, 5000);
        } catch (e) { setError(e.message); }
    };

    const remove = async () => {
        if (!window.confirm('Delete this paper and all its questions?')) return;
        try {
            await api(`/papers/${params.id}`, { method: 'DELETE' });
            router.push('/dashboard');
        } catch (e) { setError(e.message); }
    };

    if (loading || !user) return <p className="muted">Loading...</p>;
    if (error && !data) return <div className="alert err">{error}</div>;
    if (!data) return <p className="muted">Loading...</p>;

    const { paper, questions } = data;
    const mine = String(paper.uploadedBy) === user.id;

    return (
        <>
            <p><Link href={`/subjects/${paper.subject._id}`}>Back to {paper.subject.name}</Link></p>
            <h1 style={{ fontSize: '2rem' }}>{paper.subject.name}, {paper.year}{paper.examType === 'backlog' ? ' (backlog)' : ''}</h1>
            <p>
                <span className={`tag ${paper.status}`}>{paper.status}</span>
                <span className={`tag ${paper.moderation}`}>{paper.moderation}</span>
                <span className="muted">{questions.length} questions</span>
            </p>
            {error && <div className="alert err">{error}</div>}
            {msg && <div className="alert ok">{msg}</div>}
            <div className="row" style={{ marginBottom: '1.25rem' }}>
                {user.role === 'admin' && <button className="btn ghost" onClick={retag}>Re-tag with AI</button>}
                {(user.role === 'admin' || mine) && <button className="btn danger" onClick={remove}>Delete paper</button>}
            </div>
            <div className="panel">
                <h2>Questions in this paper</h2>
                {questions.length === 0 && <p className="muted">No questions yet. If the status is failed, ask an admin to try again.</p>}
                {questions.map((q) => (
                    <div className="q" key={q._id}>
                        <strong>Q{q.number}.</strong> {q.text}<br />
                        <small><span className="tag">{q.topic}</span>{q.marks ? `${q.marks} marks, ` : ''}{q.difficulty}</small>
                    </div>
                ))}
            </div>
        </>
    );
}
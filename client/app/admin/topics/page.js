'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useRequireAuth } from '../../../lib/auth-context';

export default function TopicCleanup() {
    const { user, loading } = useRequireAuth('admin');
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [topics, setTopics] = useState([]);
    const [picked, setPicked] = useState([]);
    const [target, setTarget] = useState('');
    const [groups, setGroups] = useState([]);
    const [busy, setBusy] = useState(''); // which action is running: 'suggest' | 'merge' | 'detect' | 'apply-<i>'
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => { if (user) api('/subjects').then((d) => setSubjects(d.subjects)).catch(() => { }); }, [user]);

    const loadTopics = async (id) => {
        try { setTopics((await api(`/admin/subjects/${id}/topics`)).topics); }
        catch (e) { setError(e.message); }
    };

    const chooseSubject = (id) => {
        setSubjectId(id); setPicked([]); setTarget(''); setGroups([]); setMsg(''); setError('');
        setTopics([]);
        if (id) loadTopics(id);
    };

    const merge = async (from, to, key = 'merge') => {
        if (busy) return false;
        setBusy(key); setError(''); setMsg('');
        try {
            const d = await api(`/admin/subjects/${subjectId}/topics/merge`, { method: 'POST', body: { from, to } });
            setMsg(`${d.updated} question(s) moved to "${to}".`);
            setPicked([]); setTarget('');
            await loadTopics(subjectId);
            return true;
        } catch (e) { setError(e.message); return false; }
        finally { setBusy(''); }
    };

    const suggest = async () => {
        if (busy) return;
        setBusy('suggest'); setError(''); setMsg('');
        try {
            const d = await api(`/admin/subjects/${subjectId}/topics/suggest`, { method: 'POST' });
            setGroups(d.groups);
            if (!d.groups.length) setMsg('AI found nothing to merge.');
        } catch (e) { setError(e.message); }
        finally { setBusy(''); }
    };

    const detect = async () => {
        if (busy) return;
        setBusy('detect'); setError(''); setMsg('');
        try {
            const d = await api(`/admin/subjects/${subjectId}/repeats`, { method: 'POST' });
            setMsg(`Done: ${d.groups} repeated question group(s) found${d.failedTopics ? `. ${d.failedTopics} topic(s) were skipped because AI was busy, press the button again` : ''}.`);
        } catch (e) { setError(e.message); }
        finally { setBusy(''); }
    };

    const apply = async (i) => {
        const g = groups[i];
        if (await merge(g.sources, g.target.trim(), `apply-${i}`)) setGroups((prev) => prev.filter((_, k) => k !== i));
    };

    const toggle = (t) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

    if (loading || !user || user.role !== 'admin') return <p className="muted">Loading...</p>;

    return (
        <>
            <p><Link href="/admin">Back to Admin</Link></p>
            <h1 style={{ fontSize: '2rem' }}>Topic cleanup</h1>
            {error && <div className="alert err" role="alert">{error}</div>}
            {msg && <div className="alert ok" role="status">{msg}</div>}

            <div className="panel">
                <div className="field"><label htmlFor="sub">Subject</label>
                    <select id="sub" value={subjectId} onChange={(e) => chooseSubject(e.target.value)}>
                        <option value="">Choose a subject</option>
                        {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select></div>
            </div>

            {subjectId && (
                <>
                    <div className="panel">
                        <h2>Repeated questions</h2>
                        <p className="muted">AI compares the questions inside each topic and groups the ones asked again in other years. Takes about a minute. Run it again after you merge topics.</p>
                        <button className="btn" onClick={detect} disabled={busy === 'detect'}>{busy === 'detect' ? 'Detecting...' : 'Detect repeated questions'}</button>
                    </div>

                    <div className="panel">
                        <h2>AI suggestions</h2>
                        <p className="muted">AI proposes which topics to merge. Nothing changes until you press Apply. You can edit the target name first.</p>
                        <button className="btn" onClick={suggest} disabled={busy === 'suggest'}>
                            {busy === 'suggest' ? 'Asking AI...' : 'Suggest merges with AI'}
                        </button>
                        {groups.map((g, i) => (
                            <div key={g.sources.join('|')} className="q">
                                <div className="row">
                                    <div><label htmlFor={`t${i}`}>Merge into</label>
                                        <input id={`t${i}`} value={g.target} onChange={(e) => setGroups((prev) => prev.map((x, k) => (k === i ? { ...x, target: e.target.value } : x)))} /></div>
                                    <button className="btn ok small" disabled={busy === `apply-${i}` || g.target.trim().length < 2} onClick={() => apply(i)}>
                                        {busy === `apply-${i}` ? 'Applying...' : 'Apply'}
                                    </button>
                                    <button className="btn ghost small" onClick={() => !busy && setGroups((prev) => prev.filter((_, k) => k !== i))}>Skip</button>
                                </div>
                                <small>{g.sources.join(', ')}</small>
                            </div>
                        ))}
                    </div>

                    <div className="panel">
                        <h2>Merge or rename by hand</h2>
                        <p className="muted">Tick one topic to rename it, or several to merge them. Then type the final name.</p>
                        <div className="row" style={{ marginBottom: '1rem' }}>
                            <div><label htmlFor="target">Final topic name</label>
                                <input id="target" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="for example: Sorting" /></div>
                            <button className="btn" disabled={busy === 'merge' || !picked.length || target.trim().length < 2} onClick={() => merge(picked, target.trim())}>
                                {busy === 'merge' ? 'Saving...' : picked.length > 1 ? `Merge ${picked.length} topics` : 'Rename'}
                            </button>
                        </div>
                        <div className="table-scroll"><table>
                            <thead><tr><th></th><th>Topic</th><th>Questions</th><th>Years</th></tr></thead>
                            <tbody>
                                {topics.map((t) => (
                                    <tr key={t.topic}>
                                        <td><input type="checkbox" aria-label={`Select ${t.topic}`} checked={picked.includes(t.topic)} onChange={() => toggle(t.topic)} style={{ width: 'auto' }} /></td>
                                        <td>{t.topic}</td><td>{t.count}</td><td>{t.years}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                </>
            )}
        </>
    );
}
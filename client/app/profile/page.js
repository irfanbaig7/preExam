'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';
import Avatar from '../../components/shell/Avatar';

const ROLE = { student: 'Student', contributor: 'Contributor', admin: 'Admin' };

export default function ProfilePage() {
    const { user, setUser, loading, logout } = useRequireAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [examDate, setExamDate] = useState('');
    const [uploads, setUploads] = useState(null);
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!user) return;
        setName(user.name);
        setExamDate(user.examDate ? user.examDate.slice(0, 10) : '');
        api('/papers?mine=true').then((d) => setUploads(d.papers.length)).catch(() => setUploads(null));
    }, [user]);

    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setError(''); setMsg('');
        try {
            const d = await api('/auth/me', { method: 'PATCH', body: { name: name.trim(), examDate: examDate || null } });
            setUser(d.user);
            setMsg('Profile saved.');
        } catch (err) {
            setError(err.details ? Object.values(err.details).flat().join(' ') : err.message);
        } finally { setBusy(false); }
    };

    const signOut = async () => { await logout(); router.push('/'); };

    if (loading || !user) return <p className="muted">Loading...</p>;

    return (
        <>
            <div className="panel">
                <div className="profile-head">
                    <Avatar name={user.name} size="lg" />
                    <div>
                        <h1>{user.name}</h1>
                        <p className="muted" style={{ margin: '0 0 .5rem' }}>{user.email}</p>
                        <span className="tag">{ROLE[user.role] || user.role}</span>
                        <span className={`tag ${user.isPremium ? 'approved' : ''}`}>{user.isPremium ? 'Premium' : 'Free plan'}</span>
                    </div>
                </div>
            </div>

            <div className="stats">
                <div className="stat"><b>{(user.subscribedSubjects || []).length}</b>subjects followed</div>
                <div className="stat"><b>{uploads === null ? '-' : uploads}</b>papers uploaded</div>
                <div className="stat"><b>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</b>member since</div>
            </div>

            <div className="panel" id="settings">
                <h2>Account settings</h2>
                {error && <div className="alert err" role="alert">{error}</div>}
                {msg && <div className="alert ok" role="status">{msg}</div>}
                <form onSubmit={save}>
                    <div className="row">
                        <div className="field"><label htmlFor="pname">Full name</label>
                            <input id="pname" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></div>
                        <div className="field"><label htmlFor="pexam">Exam date</label>
                            <input id="pexam" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
                    </div>
                    <p className="muted">With an exam date set, you get a reminder with the most repeated topics in the last 7 days before it.</p>
                    <button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
                </form>
            </div>

            <div className="panel">
                <h2>Subscription</h2>
                {user.isPremium
                    ? <p>Premium is active{user.premiumUntil ? ` until ${new Date(user.premiumUntil).toLocaleDateString()}` : ''}.</p>
                    : <p className="muted">You are on the free plan. Premium unlocks the day-by-day study plan.</p>}
                <Link className="btn ghost small" href="/premium">{user.isPremium ? 'Manage Premium' : 'See Premium'}</Link>
            </div>

            <div className="panel">
                <h2>Session</h2>
                <button type="button" className="btn danger" onClick={signOut}>Log out</button>
            </div>
        </>
    );
}
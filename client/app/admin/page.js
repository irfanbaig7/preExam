'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';

export default function Admin() {
  const { user, loading } = useRequireAuth('admin');
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [failed, setFailed] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, p, f, u] = await Promise.all([
        api('/admin/stats'), api('/admin/papers?moderation=pending'), api('/admin/papers?status=failed'), api('/admin/users'),
      ]);
      setStats(s); setPending(p.papers); setFailed(f.papers); setUsers(u.users);
    } catch (e) { setError(e.message); }
  }, []);

  useEffect(() => { if (user && user.role === 'admin') load(); }, [user, load]);

  const moderate = async (id, action) => { await api(`/admin/papers/${id}/moderate`, { method: 'PATCH', body: { action } }); load(); };
  const reprocess = async (id) => { await api(`/admin/papers/${id}/reprocess`, { method: 'POST' }); load(); };
  const setRole = async (id, role) => { await api(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }).catch((e) => setError(e.message)); load(); };

  if (loading || !user || user.role !== 'admin') return <p className="muted">Loading...</p>;

  const paperRows = (list, actions) => (
    <div className="table-scroll"><table>
      <thead><tr><th>Subject</th><th>Year</th><th>By</th><th>Status</th><th>Questions</th><th></th></tr></thead>
      <tbody>
        {list.map((p) => (
          <tr key={p._id}>
            <td>{p.subject ? p.subject.name : ''}</td><td>{p.year}</td>
            <td>{p.uploadedBy ? p.uploadedBy.name : ''}</td>
            <td><span className={`tag ${p.status}`}>{p.status}</span>{p.failReason && <div className="field-error">{p.failReason}</div>}</td>
            <td>{p.questionCount}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{actions(p)}</td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );

  return (
    <>
      <h1 style={{ fontSize: '2rem' }}>Admin</h1>
      {error && <div className="alert err">{error}</div>}
      {stats && (
        <div className="stats">
          <div className="stat"><b>{stats.users}</b>users</div>
          <div className="stat"><b>{stats.subjects}</b>subjects</div>
          <div className="stat"><b>{stats.questions}</b>approved questions</div>
          <div className="stat"><b>{stats.papers.pending}</b>awaiting review</div>
          <div className="stat"><b>{stats.queue.pending + stats.queue.running}</b>jobs in queue</div>
        </div>
      )}

      <div className="panel">
        <h2>Papers awaiting review</h2>
        {pending.length === 0 ? <p className="muted">Nothing to review.</p> : paperRows(pending, (p) => (
          <>
            <button className="btn ok small" onClick={() => moderate(p._id, 'approve')}>Approve</button>{' '}
            <button className="btn danger small" onClick={() => moderate(p._id, 'reject')}>Reject</button>
          </>
        ))}
      </div>

      <div className="panel">
        <h2>Failed processing</h2>
        {failed.length === 0 ? <p className="muted">No failures.</p> : paperRows(failed, (p) => (
          <button className="btn ghost small" onClick={() => reprocess(p._id)}>Try again</button>
        ))}
      </div>

      <div className="panel">
        <h2>Users</h2>
        <div className="table-scroll"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Premium</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.email}</td>
                <td>
                  <select aria-label={`Role for ${u.name}`} value={u.role} disabled={u._id === user.id} onChange={(e) => setRole(u._id, e.target.value)} style={{ width: 'auto' }}>
                    <option value="student">student</option><option value="contributor">contributor</option><option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.isPremium ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}

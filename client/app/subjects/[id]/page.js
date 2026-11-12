'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useRequireAuth } from '../../../lib/auth-context';
import TopicBars from '../../../components/TopicBars';
import { connectSocket } from '../../../lib/socket';

export default function SubjectPage({ params }) {
  const { user, loading } = useRequireAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState(null);
  const [days, setDays] = useState(7);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState('');
  const [planBusy, setPlanBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = () => api(`/subjects/${params.id}`).then(setData).catch((e) => setError(e.message));
    load();
    const s = connectSocket();
    // is subject ka koi notification aaye to analytics dobara load karo
    s.on('notification', (n) => { if (n.link === `/subjects/${params.id}`) load(); });
    return () => s.disconnect();
  }, [user, params.id]);

  const makePlan = async () => {
    setPlanBusy(true);
    setPlanError('');
    try { setPlan(await api(`/subjects/${params.id}/plan`, { method: 'POST', body: { days: Number(days) } })); }
    catch (e) { setPlanError(e.status === 402 ? 'The study plan is a Premium feature.' : e.message); }
    finally { setPlanBusy(false); }
  };

  if (loading || !user) return <p className="muted">Loading...</p>;
  if (error) return <div className="alert err">{error}</div>;
  if (!data) return <p className="muted">Loading...</p>;

  const { subject, analytics } = data;
  const shown = topic ? analytics.important.find((i) => i.topic === topic) : null;

  return (
    <>
      <h1 style={{ fontSize: '2.2rem' }}>{subject.name}</h1>
      <p className="muted">{subject.code}, {subject.university}</p>
      <div className="row" style={{ marginBottom: '1.25rem' }}>
        <Link className="btn" href={`/upload?subject=${subject._id}`} style={{ flex: '0 0 auto' }}>Upload a paper</Link>
        <Link className="btn ghost" href={`/room?subject=${subject._id}`} style={{ flex: '0 0 auto' }}>Open study room</Link>
      </div>

      <div className="stats">
        <div className="stat"><b>{analytics.papers.length}</b>papers</div>
        <div className="stat"><b>{analytics.totalYears}</b>years covered</div>
        <div className="stat"><b>{analytics.topics.length}</b>topics found</div>
      </div>

      <div className="panel">
        <h2>Topics by how often they repeat</h2>
        <p className="muted">Select a topic to see its most recent questions.</p>
        <TopicBars topics={analytics.topics} active={topic} onPick={setTopic} />
      </div>

      <div className="panel">
        <h2>{topic ? `Recent questions on ${topic}` : 'Questions to practise first'}</h2>
        {(shown ? [shown] : analytics.important.slice(0, 5)).map((group) => (
          <div key={group.topic} style={{ marginBottom: '.75rem' }}>
            {!shown && <h3>{group.topic}</h3>}
            {group.questions.map((q, i) => (
              <div className="q" key={i}>{q.text}<br /><small>{q.year}{q.marks ? `, ${q.marks} marks` : ''}</small></div>
            ))}
          </div>
        ))}
        {analytics.important.length === 0 && <p className="muted">Nothing to practise yet. Upload and approve a paper first.</p>}
      </div>

      <div className="panel">
        <h2>Study plan</h2>
        <p className="muted">A day-by-day plan that starts with the topics that repeat most. Premium feature.</p>
        <div className="row">
          <div><label htmlFor="days">Days left</label><input id="days" type="number" min="1" max="30" value={days} onChange={(e) => setDays(e.target.value)} /></div>
          <button className="btn" onClick={makePlan} disabled={planBusy}>{planBusy ? 'Building plan...' : 'Build my plan'}</button>
        </div>
        {planError && <div className="alert err" style={{ marginTop: '1rem' }}>{planError} {planError.includes('Premium') && <Link href="/premium">See Premium</Link>}</div>}
        {plan && (
          <ol style={{ marginTop: '1rem', paddingLeft: '1.2rem' }}>
            {plan.days.map((d) => (
              <li key={d.day} style={{ marginBottom: '.6rem' }}>
                <strong>Day {d.day}:</strong> {(d.focus || []).join(', ')}
                <div className="muted">{d.tip}</div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="panel">
        <h2>Papers</h2>
        {analytics.papers.length === 0 ? <p className="muted">No approved papers yet.</p> : (
          <div className="table-scroll"><table>
            <thead><tr><th>Year</th><th>Type</th><th>Questions</th></tr></thead>
            <tbody>{analytics.papers.map((p, i) => <tr key={i}><td>{p.year}</td><td>{p.examType}</td><td>{p.questionCount}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

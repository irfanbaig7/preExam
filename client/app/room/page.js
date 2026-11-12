'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useRequireAuth } from '../../lib/auth-context';
import { connectSocket } from '../../lib/socket';

function Room() {
  const { user, loading } = useRequireAuth();
  const params = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(params.get('subject') || '');
  const [messages, setMessages] = useState([]);
  const [count, setCount] = useState(0);
  const [text, setText] = useState('');
  const socketRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { if (user) api('/subjects').then((d) => setSubjects(d.subjects)).catch(() => { }); }, [user]);
  
  const subjectRef = useRef(subjectId);

  useEffect(() => {
    if (!user) return;
    const s = connectSocket();
    socketRef.current = s;
    // jab bhi connect ho (pehli baar ya server restart ke baad), room me wapas join karo
    s.on('connect', () => {
      if (subjectRef.current) s.emit('room:join', { subjectId: subjectRef.current });
    });
    s.on('room:history', setMessages);
    s.on('room:message', (m) => setMessages((prev) => [...prev, m]));
    s.on('room:presence', (p) => setCount(p.count));
    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    subjectRef.current = subjectId;
    const s = socketRef.current;
    if (subjectId && s && s.connected) {
      setMessages([]);
      s.emit('room:join', { subjectId });
    }
  }, [subjectId, user]);

  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ block: 'end' }); }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('room:message', { text });
    setText('');
  };

  if (loading || !user) return <p className="muted">Loading...</p>;

  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <h2>Study room</h2>
      <p className="muted">Everyone who joins a subject room sees the same live chat. The last 50 messages are kept while the server runs.</p>
      <div className="field"><label htmlFor="s">Subject</label>
        <select id="s" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Choose a subject to join</option>
          {subjects.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
        </select></div>
      {subjectId ? (
        <>
          <p className="muted">{count} online in this room</p>
          <div className="chat" aria-live="polite">
            {messages.length === 0 && <p className="muted">No messages yet. Ask a question or share a trick.</p>}
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.userId === user.id ? 'me' : ''}`}><b>{m.userId === user.id ? 'You' : m.from}:</b> {m.text}</div>
            ))}
            <div ref={endRef} />
          </div>
          <form className="row" onSubmit={send}>
            <input aria-label="Message" placeholder="Write a message" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn">Send</button>
          </form>
        </>
      ) : <p className="muted">Pick a subject to see who is studying it.</p>}
    </div>
  );
}

export default function RoomPage() {
  return <Suspense fallback={<p className="muted">Loading...</p>}><Room /></Suspense>;
}

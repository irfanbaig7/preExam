'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { connectSocket } from '../lib/socket';

export default function Bell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    api('/notifications').then((d) => { setItems(d.notifications); setUnread(d.unread); }).catch(() => {});
    const socket = connectSocket();
    socket.on('notification', (n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((u) => u + 1);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      await api('/notifications/read-all', { method: 'PATCH' }).catch(() => {});
      setUnread(0);
    }
  };

  return (
    <div className="bell" ref={box}>
      <button className="link-btn" onClick={toggle} aria-label={`Notifications, ${unread} unread`}>
        Alerts{unread > 0 && <span className="badge">{unread}</span>}
      </button>
      {open && (
        <div className="bell-panel">
          {items.length === 0 && <p className="muted pad">Nothing yet. Subscribe to a subject to hear about new papers.</p>}
          {items.map((n) => (
            <Link key={n._id} href={n.link || '/dashboard'} className="bell-item" onClick={() => setOpen(false)}>
              <strong>{n.title}</strong>
              {n.body && <span>{n.body}</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

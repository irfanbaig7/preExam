'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { connectSocket } from '../lib/socket';
import Icon from './Icon';
import useDismiss from './shell/useDismiss';

export default function Bell() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);

  useEffect(() => {
    api('/notifications').then((d) => { setItems(d.notifications); setUnread(d.unread); }).catch(() => { });
    const socket = connectSocket();
    socket.on('notification', (n) => {
      setItems((prev) => [n, ...prev].slice(0, 30));
      setUnread((u) => u + 1);
    });
    return () => socket.disconnect();
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread) {
      await api('/notifications/read-all', { method: 'PATCH' }).catch(() => { });
      setUnread(0);
    }
  };

  return (
    <div className="menu" ref={box}>
      <button type="button" className="icon-btn" onClick={toggle} aria-label={`Notifications, ${unread} unread`} aria-expanded={open}>
        <Icon name="bell" />
        {unread > 0 && <span className="badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="menu-panel">
          <div className="menu-title">Notifications</div>
          {items.length === 0 && <p className="muted pad">Nothing yet. Follow a subject to hear about new papers.</p>}
          {items.map((n) => (
            <Link key={n._id} href={n.link || '/dashboard'} className="menu-item" onClick={close}>
              <span><strong>{n.title}</strong>{n.body && <small>{n.body}</small>}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
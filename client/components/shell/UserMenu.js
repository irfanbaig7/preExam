'use client';
import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import Icon from '../Icon';
import Avatar from './Avatar';
import useDismiss from './useDismiss';

export default function UserMenu() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(ref, open, close);

    const out = async () => { close(); await logout(); router.push('/'); };

    return (
        <div className="menu" ref={ref}>
            <button type="button" className="avatar-btn" onClick={() => setOpen((o) => !o)} aria-label="Account menu" aria-expanded={open}>
                <Avatar name={user.name} />
            </button>
            {open && (
                <div className="menu-panel">
                    <div className="menu-head">
                        <Avatar name={user.name} />
                        <div className="menu-who">
                            <b>{user.name}</b>
                            <small>{user.email}</small>
                            <span className="tag">{user.role}</span>
                        </div>
                    </div>
                    <div className="menu-sep" />
                    <Link className="menu-item" href="/profile" onClick={close}><Icon name="user" size={18} />My profile</Link>
                    <Link className="menu-item" href="/profile#settings" onClick={close}><Icon name="settings" size={18} />Account settings</Link>
                    <Link className="menu-item" href="/premium" onClick={close}>
                        <Icon name="star" size={18} />
                        <span>Subscription<small>{user.isPremium ? 'Premium is active' : 'Free plan'}</small></span>
                    </Link>
                    <div className="menu-sep" />
                    <button type="button" className="menu-item" onClick={out}><Icon name="log-out" size={18} />Log out</button>
                </div>
            )}
        </div>
    );
}
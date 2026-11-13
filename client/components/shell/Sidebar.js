'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import Icon from '../Icon';
import Avatar from './Avatar';
import { NAV, isActive } from './nav';

export default function Sidebar({ collapsed, onToggle, open, onClose }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const groups = NAV.filter((g) => !g.roles || g.roles.includes(user.role));

    return (
        <>
            <div className={`scrim ${open ? 'show' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Primary">
                <div className="sb-head">
                    <Link href="/dashboard" className="brand" onClick={onClose}>
                        <span className="logo">P</span>
                        <span className="brand-text">PYQ Analyzer</span>
                    </Link>
                    <button type="button" className="icon-btn sb-collapse" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                        <Icon name={collapsed ? 'chevrons-right' : 'chevrons-left'} size={18} />
                    </button>
                </div>

                <nav className="sb-nav">
                    {groups.map((g) => (
                        <div key={g.section} className="sb-group">
                            <div className="sb-label">{g.section}</div>
                            {g.items.map((it) => {
                                const active = isActive(it, pathname);
                                return (
                                    <Link key={it.href} href={it.href} className={`sb-item ${active ? 'active' : ''}`} data-tip={it.label} aria-current={active ? 'page' : undefined} onClick={onClose}>
                                        <Icon name={it.icon} />
                                        <span className="sb-text">{it.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <Link href="/profile" className="sb-user" onClick={onClose}>
                    <Avatar name={user.name} />
                    <span className="sb-meta"><b>{user.name}</b><small>{user.email}</small></span>
                </Link>
            </aside>
        </>
    );
}
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import MobileNav from './MobileNav';

const PUBLIC_PATHS = ['/', '/login', '/register'];

function PublicLayout({ user, loading, children }) {
    return (
        <>
            <header className="pub-head">
                <Link href={user ? '/dashboard' : '/'} className="brand">
                    <span className="logo">P</span><span className="brand-text">PYQ Analyzer</span>
                </Link>
                {!loading && (
                    <div className="pub-actions">
                        {user ? (
                            <Link className="btn small" href="/dashboard">Open dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="btn ghost small">Log in</Link>
                                <Link href="/register" className="btn small">Create account</Link>
                            </>
                        )}
                    </div>
                )}
            </header>
            <main className="wrap">{children}</main>
        </>
    );
}

export default function AppShell({ children }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [drawer, setDrawer] = useState(false);

    useEffect(() => {
        try { setCollapsed(localStorage.getItem('pyq_sidebar') === '1'); } catch { /* storage blocked */ }
    }, []);
    useEffect(() => { setDrawer(false); }, [pathname]);

    // Ctrl/Cmd + K opens search
    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                router.push('/search');
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [router]);

    const toggle = () => setCollapsed((c) => {
        const next = !c;
        try { localStorage.setItem('pyq_sidebar', next ? '1' : '0'); } catch { /* storage blocked */ }
        return next;
    });

    if (loading || !user || PUBLIC_PATHS.includes(pathname)) {
        return <PublicLayout user={user} loading={loading}>{children}</PublicLayout>;
    }

    return (
        <div className={`app ${collapsed ? 'collapsed' : ''}`}>
            <Sidebar collapsed={collapsed} onToggle={toggle} open={drawer} onClose={() => setDrawer(false)} />
            <div className="main">
                <TopHeader onMenu={() => setDrawer(true)} />
                <main className="content">{children}</main>
            </div>
            <MobileNav />
        </div>
    );
}
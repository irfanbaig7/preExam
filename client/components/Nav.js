'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import Bell from './Bell';

export default function Nav() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="nav">
      <Link href={user ? '/dashboard' : '/'} className="brand">PYQ Analyzer</Link>
      {!loading && (
        <nav>
          {user ? (
            <>
              <Link href="/dashboard">Subjects</Link>
              <Link href="/search">Search</Link>
              <Link href="/upload">Upload</Link>
              <Link href="/room">Study room</Link>
              <Link href="/premium">{user.isPremium ? 'Premium' : 'Go Premium'}</Link>
              {user.role === 'admin' && <Link href="/admin">Admin</Link>}
              <Bell />
              <button className="link-btn" onClick={async () => { await logout(); router.push('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <Link href="/login">Log in</Link>
              <Link href="/register" className="btn small">Create account</Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

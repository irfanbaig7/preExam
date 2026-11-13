'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../Icon';
import { MOBILE_TABS, isActive } from './nav';

export default function MobileNav() {
    const pathname = usePathname();
    return (
        <nav className="bottom-nav" aria-label="Quick navigation">
            {MOBILE_TABS.map((t) => {
                const active = isActive(t, pathname);
                return (
                    <Link key={t.href} href={t.href} className={`bn-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
                        <Icon name={t.icon} />
                        <span>{t.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../Icon';

const LABELS = {
    dashboard: 'Overview', search: 'Search questions', upload: 'Upload papers', room: 'Study room',
    premium: 'Premium', profile: 'My profile', admin: 'Admin', topics: 'Topic cleanup',
};
const isId = (s) => /^[a-f0-9]{24}$/i.test(s);

export default function Breadcrumbs() {
    const pathname = usePathname();
    const parts = pathname.split('/').filter(Boolean);

    const list = [];
    // /subjects and /papers have no page of their own, so they hang under Overview
    if (parts[0] === 'subjects' || parts[0] === 'papers') list.push({ label: 'Overview', href: '/dashboard' });
    parts.forEach((p, i) => {
        if (p === 'subjects' || p === 'papers') return;
        list.push({
            label: isId(p) ? (parts[i - 1] === 'papers' ? 'Paper' : 'Subject') : LABELS[p] || p,
            href: '/' + parts.slice(0, i + 1).join('/'),
        });
    });

    return (
        <nav className="crumbs" aria-label="Breadcrumb">
            {list.flatMap((c, i) => {
                const last = i === list.length - 1;
                const el = last
                    ? <span key={`c${i}`} className="crumb cur" aria-current="page">{c.label}</span>
                    : <Link key={`c${i}`} href={c.href} className="crumb">{c.label}</Link>;
                return last ? [el] : [el, <Icon key={`s${i}`} name="chevron-right" size={14} />];
            })}
        </nav>
    );
}
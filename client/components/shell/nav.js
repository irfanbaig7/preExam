// One place that decides which links exist. Add an item here when a new page is built.
export const NAV = [
    {
        section: 'Workspace',
        items: [
            { href: '/dashboard', label: 'Overview', icon: 'home', match: (p) => p === '/dashboard' || p.startsWith('/subjects') || p.startsWith('/papers') },
            { href: '/search', label: 'Search questions', icon: 'search' },
            { href: '/upload', label: 'Upload papers', icon: 'upload' },
        ],
    },
    { section: 'Study', items: [{ href: '/room', label: 'Study room', icon: 'chat' }] },
    {
        section: 'Account',
        items: [
            { href: '/premium', label: 'Premium', icon: 'star' },
            { href: '/profile', label: 'My profile', icon: 'user' },
        ],
    },
    {
        section: 'Admin',
        roles: ['admin'],
        items: [
            { href: '/admin', label: 'Admin overview', icon: 'shield', exact: true },
            { href: '/admin/topics', label: 'Topic cleanup', icon: 'layers' },
        ],
    },
];

export const MOBILE_TABS = [
    { href: '/dashboard', label: 'Overview', icon: 'home', match: NAV[0].items[0].match },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/upload', label: 'Upload', icon: 'upload' },
    { href: '/room', label: 'Room', icon: 'chat' },
    { href: '/profile', label: 'Profile', icon: 'user' },
];

export function isActive(item, pathname) {
    if (item.match) return item.match(pathname);
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
}
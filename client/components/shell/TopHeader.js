'use client';
import Link from 'next/link';
import Icon from '../Icon';
import Bell from '../Bell';
import Breadcrumbs from './Breadcrumbs';
import HelpMenu from './HelpMenu';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';

export default function TopHeader({ onMenu }) {
    return (
        <header className="topbar">
            <button type="button" className="icon-btn menu-btn" onClick={onMenu} aria-label="Open navigation"><Icon name="menu" /></button>
            <Breadcrumbs />
            <div className="topbar-spacer" />
            <Link href="/search" className="search-chip" aria-label="Search questions">
                <Icon name="search" size={16} /><span>Search questions</span><kbd>Ctrl K</kbd>
            </Link>
            <HelpMenu />
            <ThemeToggle />
            <Bell />
            <UserMenu />
        </header>
    );
}
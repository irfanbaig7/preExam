'use client';
import { useEffect, useState } from 'react';
import Icon from '../Icon';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('dark');
    useEffect(() => { setTheme(document.documentElement.dataset.theme || 'dark'); }, []);

    const flip = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('pyq_theme', next); } catch { /* storage blocked */ }
        setTheme(next);
    };

    const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    return (
        <button type="button" className="icon-btn" onClick={flip} aria-label={label} title={label}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
    );
}
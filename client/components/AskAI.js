'use client';
import { useState } from 'react';
import { api } from '../lib/api';
import Markdown from './Markdown';

export default function AskAI({ questionId }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [answer, setAnswer] = useState('');
    const [cached, setCached] = useState(false);
    const [error, setError] = useState('');

    const toggle = async () => {
        if (busy) return;
        const next = !open;
        setOpen(next);
        if (!next || answer) return;
        setBusy(true);
        setError('');
        try {
            const d = await api(`/questions/${questionId}/explain`, { method: 'POST' });
            setAnswer(d.answer);
            setCached(d.cached);
        } catch (e) { setError(e.message); }
        finally { setBusy(false); }
    };

    return (
        <div className="ai-box">
            <button type="button" className="btn ghost small" onClick={toggle} aria-expanded={open}>
                {busy ? 'Thinking...' : open ? 'Hide AI answer' : 'Ask AI'}
            </button>
            {open && error && <div className="alert err" role="alert" style={{ marginTop: '.6rem' }}>{error}</div>}
            {open && answer && (
                <div className="ai-answer">
                    <Markdown text={answer} />
                    <p className="ai-note">{cached ? 'Saved answer' : 'Generated just now'}. AI can make mistakes, so check important points with your textbook.</p>
                </div>
            )}
        </div>
    );
}
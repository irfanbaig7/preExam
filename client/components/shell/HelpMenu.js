'use client';
import { useCallback, useRef, useState } from 'react';
import Icon from '../Icon';
import useDismiss from './useDismiss';

export default function HelpMenu() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const close = useCallback(() => setOpen(false), []);
    useDismiss(ref, open, close);

    return (
        <div className="menu" ref={ref}>
            <button type="button" className="icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Help" aria-expanded={open}>
                <Icon name="help" />
            </button>
            {open && (
                <div className="menu-panel">
                    <div className="menu-title">Quick help</div>
                    <p className="menu-note"><b>Search anywhere.</b> Press <kbd>Ctrl</kbd> <kbd>K</kbd> to search every question.</p>
                    <p className="menu-note"><b>Upload a paper.</b> Use a PDF with numbered questions ("1." or "Q1."), or paste the text.</p>
                    <p className="menu-note"><b>Scanned PDFs.</b> Text recognition (OCR) is not available yet, so paste the text instead.</p>
                    <p className="menu-note"><b>Review.</b> Papers from students are checked by an admin before everyone sees them.</p>
                </div>
            )}
        </div>
    );
}
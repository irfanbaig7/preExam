import { useEffect } from 'react';

// Closes a dropdown on outside click or Escape
export default function useDismiss(ref, open, close) {
    useEffect(() => {
        if (!open) return undefined;
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, ref, close]);
}
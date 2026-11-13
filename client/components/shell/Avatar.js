// Initials avatar. Photo upload comes in a later phase.
export default function Avatar({ name = '', size }) {
    const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
    return <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} aria-hidden="true">{initials}</span>;
}
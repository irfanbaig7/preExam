'use client';

// Highlighter-style bars: width = share of years the topic appeared in
export default function TopicBars({ topics, onPick, active }) {
  if (!topics.length) return <p className="muted">No approved papers yet, so there are no trends to show.</p>;
  const max = Math.max(...topics.map((t) => t.count));
  return (
    <ul className="bars">
      {topics.map((t) => (
        <li key={t.topic}>
          <button
            className={`bar-row ${active === t.topic ? 'on' : ''}`}
            onClick={() => onPick && onPick(active === t.topic ? null : t.topic)}
            title={`Asked in: ${t.years.join(', ')}`}
          >
            <span className="bar-label">{t.topic}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${Math.max(6, (t.count / max) * 100)}%` }} />
            </span>
            <span className="bar-meta">{t.count} questions, {t.appearsInPercent}% of years</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

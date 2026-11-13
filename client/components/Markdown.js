// Minimal Markdown: headings, lists, bold, inline code, code blocks. Builds React elements only (no raw HTML).
function inline(text) {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
        if (p.length > 4 && p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.length > 2 && p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>;
        return p;
    });
}

function renderText(chunk, base) {
    const out = [];
    let list = null;
    let para = [];
    const flushPara = () => {
        if (para.length) { out.push(<p key={`${base}-p${out.length}`}>{inline(para.join(' '))}</p>); para = []; }
    };
    const flushList = () => {
        if (!list) return;
        const Tag = list.ordered ? 'ol' : 'ul';
        const extra = list.ordered ? { start: list.start } : {};
        out.push(<Tag key={`${base}-l${out.length}`} {...extra}>{list.items.map((t, i) => <li key={i}>{inline(t)}</li>)}</Tag>);
        list = null;
    };
    for (const raw of chunk.split('\n')) {
        const line = raw.trimEnd();
        const h = line.match(/^#{1,4}\s+(.*)$/);
        const ul = line.match(/^\s*[-*]\s+(.*)$/);
        const ol = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
        if (h) { flushPara(); flushList(); out.push(<h3 key={`${base}-h${out.length}`}>{inline(h[1])}</h3>); }
        else if (ul || ol) {
            flushPara();
            const ordered = Boolean(ol);
            if (list && list.ordered !== ordered) flushList();
            if (!list) list = { ordered, items: [], start: ordered ? Number(ol[1]) : 1 };
            list.items.push(ordered ? ol[2] : ul[1]);
        } else if (!line.trim()) { flushPara(); flushList(); }
        else { flushList(); para.push(line.trim()); }
    }
    flushPara();
    flushList();
    return out;
}

export default function Markdown({ text }) {
    const chunks = String(text || '').split(/```[a-zA-Z0-9]*\n?/);
    return chunks.map((chunk, i) =>
        i % 2 === 1
            ? <pre key={i}><code>{chunk.replace(/\n$/, '')}</code></pre>
            : renderText(chunk, i)
    );
}
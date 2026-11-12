import Link from 'next/link';

const SAMPLE = [
  ['Linked Lists', 100, '4 of 4 papers'],
  ['Binary Trees', 100, '4 of 4 papers'],
  ['Sorting', 100, '4 of 4 papers'],
  ['Graph Traversal', 75, '3 of 4 papers'],
  ['Hashing', 50, '2 of 4 papers'],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>Find out what the exam keeps asking, before you open the textbook.</h1>
          <p className="lead">
            Upload previous-year question papers. PYQ Analyzer splits them into questions, groups them by topic and
            shows which topics come back year after year.
          </p>
          <div className="actions">
            <Link href="/register" className="btn">Start with a subject</Link>
            <Link href="/login" className="btn ghost">I have an account</Link>
          </div>
        </div>
        <div className="sheet" aria-label="Example topic frequency">
          <h3>Data Structures, last 4 papers</h3>
          <p className="muted">Sample data. Yours comes from the papers you upload.</p>
          <ul className="bars">
            {SAMPLE.map(([name, pct, note]) => (
              <li key={name} className="bar-row" style={{ cursor: 'default' }}>
                <span className="bar-label">{name}</span>
                <span className="bar-track"><span className="bar-fill" style={{ width: `${pct}%` }} /></span>
                <span className="bar-meta">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="features">
        <div><h3>Upload a PDF or paste text</h3><p className="muted">Questions are found and numbered for you. Scanned papers can be pasted as text.</p></div>
        <div><h3>See repeated topics</h3><p className="muted">Each topic shows how many questions and how many years it appeared in.</p></div>
        <div><h3>Search every question</h3><p className="muted">Look up any term and get matching questions across all papers, with the year.</p></div>
        <div><h3>Plan your days</h3><p className="muted">Premium builds a day-by-day plan that starts with the most repeated topics.</p></div>
      </section>
    </>
  );
}

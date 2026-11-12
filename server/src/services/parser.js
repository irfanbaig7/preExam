// Turns raw paper text into separate questions and guesses a topic when AI is unavailable.

const Q_PREFIXED = /^\s*Q\.?\s*(\d{1,2})\s*[.):\-]?\s*(.*)$/i;
const NUMBERED = /^\s*(\d{1,2})\s*[.)]\s+(\S.*)$/;

const MARKS_TAGGED = /[\[(]\s*(\d{1,2})\s*(?:marks?|m)\s*[\])]/gi;
const MARKS_BARE_END = /\[(\d{1,2})\]\s*$/;

function extractMarks(text) {
  let marks = null;
  let m;
  MARKS_TAGGED.lastIndex = 0;
  while ((m = MARKS_TAGGED.exec(text))) marks = Number(m[1]);
  if (marks === null) {
    const end = text.match(MARKS_BARE_END);
    if (end) marks = Number(end[1]);
  }
  return marks;
}

function splitQuestions(raw) {
  const lines = String(raw || '').replace(/\r/g, '').split('\n');
  const found = [];
  let cur = null;

  for (const line of lines) {
    const m = line.match(Q_PREFIXED) || line.match(NUMBERED);
    if (m) {
      if (cur) found.push(cur);
      cur = { number: Number(m[1]), parts: [m[2] || ''] };
    } else if (cur && line.trim()) {
      cur.parts.push(line.trim());
    }
  }
  if (cur) found.push(cur);

  return found
    .map((q) => {
      const text = q.parts.join(' ').replace(/\s+/g, ' ').trim();
      return { number: q.number, text, marks: extractMarks(text) };
    })
    .filter((q) => q.text.length >= 15 && q.text.length <= 1500);
}

const STOP = new Set(('explain define write what is are the a an of with and or in on for to by give state differentiate between discuss ' +
  'describe compare short notes note example examples using following algorithm program find solve draw list any two three briefly how why ' +
  'which from that this its it be can also mention various different types type steps show derive prove consider given below above each ' +
  'numerical problem questions question answer attempt all marks mark use apply implement analyse analyze evaluate illustrate').split(' '));

function guessTopic(text) {
  const words = String(text).toLowerCase().replace(/\([^)]*\)/g, ' ').match(/[a-z][a-z\-]{2,}/g) || [];
  const picked = words.filter((w) => !STOP.has(w)).slice(0, 2);
  if (!picked.length) return 'General';
  return picked.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

module.exports = { splitQuestions, extractMarks, guessTopic };

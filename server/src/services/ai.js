// Claude API helpers via plain fetch. Every function has a non-AI fallback so the app works with no API key.
const env = require('../config/env');
const { guessTopic } = require('./parser');

async function callClaude(system, user, maxTokens = 2000) {
  if (!env.ANTHROPIC_API_KEY) return null;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });
    if (!res.ok) {
      console.warn('[ai] request failed with status', res.status);
      return null;
    }
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('');
  } catch (e) {
    console.warn('[ai] request error:', e.message);
    return null;
  }
}

function parseJson(text) {
  if (!text) return null;
  const clean = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(clean); } catch { /* try to find JSON inside */ }
  const m = clean.match(/[\[{][\s\S]*[\]}]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

// items: [{ text }]  ->  [{ topic, difficulty }] (same order, same length)
async function tagQuestions(items, subjectName) {
  const fallback = items.map((q) => ({ topic: guessTopic(q.text), difficulty: 'medium' }));
  if (!env.ANTHROPIC_API_KEY) return fallback;

  const result = [...fallback];
  const CHUNK = 40;
  for (let start = 0; start < items.length; start += CHUNK) {
    const slice = items.slice(start, start + CHUNK);
    const list = slice.map((q, i) => `${i}: ${q.text.slice(0, 300)}`).join('\n');
    const out = await callClaude(
      'You label university exam questions. Reply with JSON only, no prose.',
      `Subject: ${subjectName}\nFor each question give a short syllabus topic (2-4 words, Title Case, reuse the same name for the same topic) and a difficulty (easy, medium or hard).\n` +
      `Return a JSON array like [{"i":0,"topic":"Binary Trees","difficulty":"medium"}].\n\nQuestions:\n${list}`,
      3000
    );
    const parsed = parseJson(out);
    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        const idx = start + Number(row.i);
        if (Number.isInteger(row.i) && result[idx] && typeof row.topic === 'string') {
          result[idx] = {
            topic: row.topic.trim().slice(0, 60) || result[idx].topic,
            difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium',
          };
        }
      }
    }
  }
  return result;
}

// Fallback plan: spread topics across days by how often they appear, last day is revision
function basicPlan(topics, days) {
  const studyDays = Math.max(1, days - 1);
  const buckets = Array.from({ length: studyDays }, () => []);
  topics.forEach((t, i) => buckets[i % studyDays].push(t.topic));
  const plan = buckets.map((focus, i) => ({
    day: i + 1,
    focus,
    tip: 'Solve the previous-year questions for these topics first, then read theory for gaps.',
  }));
  if (days > 1) plan.push({ day: days, focus: ['Revision'], tip: 'Re-attempt the most repeated questions without looking at answers.' });
  return plan;
}

async function studyPlan({ subjectName, topics, days }) {
  const top = topics.slice(0, 15);
  const out = await callClaude(
    'You are an exam coach for university students. Reply with JSON only, no prose.',
    `Subject: ${subjectName}. Days left: ${days}.\nTopics with how many times they appeared in past papers:\n` +
    top.map((t) => `${t.topic} (${t.count}x, in ${t.appearsInPercent}% of years)`).join('\n') +
    `\nMake a day-by-day plan that covers the most repeated topics first and keeps the last day for revision. ` +
    `Return {"days":[{"day":1,"focus":["Topic"],"tip":"one short sentence"}]} with exactly ${days} entries.`,
    2500
  );
  const parsed = parseJson(out);
  if (parsed && Array.isArray(parsed.days) && parsed.days.length) return { source: 'ai', days: parsed.days };
  return { source: 'basic', days: basicPlan(top, days) };
}

module.exports = { tagQuestions, studyPlan, basicPlan, callClaude };

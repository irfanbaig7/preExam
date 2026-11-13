// Background job: PDF/text -> questions -> topic tags -> saved questions
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const Subject = require('../models/Subject');
const queue = require('./queue');
const { extractPdfText } = require('./pdf');
const { splitQuestions } = require('./parser');
const { tagQuestions } = require('./ai');
const { invalidateSubject } = require('./analytics');
const { notify, notifySubscribers } = require('./notify');
const { detectRepeats } = require('./repeats');

async function processPaper({ paperId }) {
  const paper = await Paper.findById(paperId).select('+rawText');
  if (!paper) return;
  paper.status = 'processing';
  paper.failReason = undefined;
  await paper.save();

  let text = paper.rawText;
  if (!text && paper.file && paper.file.path) text = await extractPdfText(paper.file.path);
  if (!text || text.trim().length < 30) {
    throw new Error('No readable text found. If this is a scanned PDF, paste the question text instead.');
  }

  const items = splitQuestions(text);
  if (!items.length) {
    throw new Error('Could not find numbered questions (like "1." or "Q1."). Check the paper format or paste the text.');
  }

  const subject = await Subject.findById(paper.subject);
  const existingTopics = await Question.distinct('topic', { subject: paper.subject, paper: { $ne: paper._id } });
  const tags = await tagQuestions(items, subject ? subject.name : 'General', existingTopics);
  const approved = paper.moderation === 'approved';

  await Question.deleteMany({ paper: paper._id });
  await Question.insertMany(
    items.map((q, i) => ({
      paper: paper._id,
      subject: paper.subject,
      year: paper.year,
      number: q.number,
      text: q.text,
      marks: q.marks ?? undefined,
      topic: tags[i].topic,
      difficulty: tags[i].difficulty,
      approved,
    }))
  );

  paper.questionCount = items.length;
  paper.status = 'ready';
  await paper.save();
  await invalidateSubject(paper.subject);

  const label = `${subject ? subject.name : 'Paper'} ${paper.year}`;
  await notify(paper.uploadedBy, {
    title: `${label} is processed`,
    body: `${items.length} questions found.${approved ? '' : ' It will appear for everyone after admin approval.'}`,
    link: `/subjects/${paper.subject}`,
  });
  if (approved) {
  detectRepeats(paper.subject).catch(() => { });

  await notifySubscribers(paper.subject, {
    title: `New paper: ${label}`,
    body: `${items.length} questions were added. Check what changed in topic trends.`,
    link: `/subjects/${paper.subject}`,
  });
}
}


async function onFail({ paperId }, err) {
  const paper = await Paper.findByIdAndUpdate(paperId, { status: 'failed', failReason: err.message }, { new: true });
  if (paper) {
    await notify(paper.uploadedBy, {
      title: 'Paper could not be processed',
      body: err.message,
      link: '/dashboard',
    }).catch(() => { });
  }
}

function start() {
  queue.register('process-paper', processPaper, { onFail });
}

// On boot, pick up papers that were mid-flight when the server stopped
async function resumeStuck() {
  const stuck = await Paper.find({ status: { $in: ['queued', 'processing'] } }).select('_id');
  stuck.forEach((p) => queue.enqueue('process-paper', { paperId: p._id.toString() }));
  if (stuck.length) console.log(`[queue] resumed ${stuck.length} unfinished paper(s)`);
}

module.exports = { start, resumeStuck };

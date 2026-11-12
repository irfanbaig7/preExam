const { splitQuestions, extractMarks, guessTopic } = require('../src/services/parser');

const sample = `
Data Structures - May 2023
Q1. Explain singly linked list insertion with algorithm. [7 marks]
Q2. a) Define stack.
    b) Convert infix to postfix using stack. (10 marks)
3. Write the merge sort algorithm and compare it with quick sort. [5]
4. Hi
`;

describe('splitQuestions', () => {
  const qs = splitQuestions(sample);
  test('finds numbered questions and ignores too-short ones', () => {
    expect(qs.map((q) => q.number)).toEqual([1, 2, 3]);
  });
  test('joins multi-line questions', () => {
    expect(qs[1].text).toContain('Convert infix to postfix');
  });
  test('reads marks', () => {
    expect(qs.map((q) => q.marks)).toEqual([7, 10, 5]);
  });
});

test('extractMarks returns null when absent', () => {
  expect(extractMarks('Explain BFS.')).toBeNull();
});

test('guessTopic skips exam verbs', () => {
  expect(guessTopic('Explain binary search tree traversal')).toBe('Binary Search');
});

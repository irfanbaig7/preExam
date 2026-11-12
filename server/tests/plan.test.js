const { basicPlan } = require('../src/services/ai');

test('basicPlan covers every topic and ends with revision', () => {
  const topics = ['A', 'B', 'C', 'D', 'E'].map((topic) => ({ topic }));
  const plan = basicPlan(topics, 4);
  expect(plan).toHaveLength(4);
  expect(plan[3].focus).toEqual(['Revision']);
  expect(plan.slice(0, 3).flatMap((d) => d.focus).sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
});

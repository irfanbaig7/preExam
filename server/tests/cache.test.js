const cache = require('../src/services/cache');

test('remember computes once, then serves from cache', async () => {
  let calls = 0;
  const compute = async () => { calls++; return { n: 42 }; };
  const a = await cache.remember('t:1', 10, compute);
  const b = await cache.remember('t:1', 10, compute);
  expect(a).toEqual({ n: 42 });
  expect(b).toEqual({ n: 42 });
  expect(calls).toBe(1);
});

test('delPrefix clears matching keys only', async () => {
  await cache.set('analytics:a', 1);
  await cache.set('other:a', 2);
  await cache.delPrefix('analytics:');
  expect(await cache.get('analytics:a')).toBeNull();
  expect(await cache.get('other:a')).toBe(2);
});

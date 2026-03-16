const test = require('node:test');
const assert = require('node:assert');
const { DATA, fmt, isWork } = require('../workday.js');

test('fmt() formats date correctly', () => {
  assert.strictEqual(fmt(new Date(2026, 0, 1)), '2026-01-01');
  assert.strictEqual(fmt(new Date(2026, 11, 31)), '2026-12-31');
  assert.strictEqual(fmt(new Date(2026, 2, 13)), '2026-03-13');
});

test('isWork() correctly identifies regular workdays', () => {
  // 2026-03-16 is a Monday
  assert.strictEqual(isWork(new Date(2026, 2, 16)), true);
  // 2026-03-17 is a Tuesday
  assert.strictEqual(isWork(new Date(2026, 2, 17)), true);
});

test('isWork() correctly identifies regular weekends', () => {
  // 2026-03-15 is a Sunday
  assert.strictEqual(isWork(new Date(2026, 2, 15)), false);
  // 2026-03-21 is a Saturday
  assert.strictEqual(isWork(new Date(2026, 2, 21)), false);
});

test('isWork() correctly identifies designated holidays', () => {
  // 2026-01-01 is New Year's Day
  assert.strictEqual(isWork(new Date(2026, 0, 1)), false);
  // 2026-10-01 is National Day
  assert.strictEqual(isWork(new Date(2026, 9, 1)), false);
});

test('isWork() correctly identifies makeup workdays', () => {
  // 2026-01-04 is a Sunday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 0, 4)), true);
  // 2026-10-10 is a Saturday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 9, 10)), true);
});

test('DATA.w is a Set', () => {
  assert.strictEqual(DATA.w instanceof Set, true);
});

test('DATA.h contains expected holidays', () => {
  assert.strictEqual(DATA.h['2026-01-01'], '元旦');
  assert.strictEqual(DATA.h['2026-02-15'], '春节');
});

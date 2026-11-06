const test = require('node:test');
const assert = require('node:assert');
const { DATA, fmt, isWork } = require('../workday.js');

test('fmt() formats date correctly', () => {
  assert.strictEqual(fmt(new Date(2026, 0, 1)), '2026-01-01');
  assert.strictEqual(fmt(new Date(2026, 11, 31)), '2026-12-31');
  assert.strictEqual(fmt(new Date(2027, 0, 1)), '2027-01-01');
  assert.strictEqual(fmt(new Date(2027, 11, 31)), '2027-12-31');
  assert.strictEqual(fmt(null), '');
  assert.strictEqual(fmt(undefined), '');
  assert.strictEqual(fmt(new Date('invalid')), '');
});

test('isWork() correctly identifies regular workdays in 2026 and 2027', () => {
  // 2026-03-16 is a Monday
  assert.strictEqual(isWork(new Date(2026, 2, 16)), true);
  // 2026-03-17 is a Tuesday
  assert.strictEqual(isWork(new Date(2026, 2, 17)), true);
  // 2027-03-15 is a Monday
  assert.strictEqual(isWork(new Date(2027, 2, 15)), true);
  // 2027-03-16 is a Tuesday
  assert.strictEqual(isWork(new Date(2027, 2, 16)), true);
});

test('isWork() correctly identifies regular weekends in 2026 and 2027', () => {
  // 2026-03-15 is a Sunday
  assert.strictEqual(isWork(new Date(2026, 2, 15)), false);
  // 2026-03-21 is a Saturday
  assert.strictEqual(isWork(new Date(2026, 2, 21)), false);
  // 2027-03-14 is a Sunday
  assert.strictEqual(isWork(new Date(2027, 2, 14)), false);
  // 2027-03-20 is a Saturday
  assert.strictEqual(isWork(new Date(2027, 2, 20)), false);
});

test('isWork() correctly identifies 2026 designated holidays', () => {
  // 2026-01-01 is New Year's Day
  assert.strictEqual(isWork(new Date(2026, 0, 1)), false);
  // 2026-02-15 is Spring Festival
  assert.strictEqual(isWork(new Date(2026, 1, 15)), false);
  // 2026-04-04 is Qingming
  assert.strictEqual(isWork(new Date(2026, 3, 4)), false);
  // 2026-05-01 is Labor Day
  assert.strictEqual(isWork(new Date(2026, 4, 1)), false);
  // 2026-06-19 is Dragon Boat Festival
  assert.strictEqual(isWork(new Date(2026, 5, 19)), false);
  // 2026-09-25 is Mid-Autumn Festival
  assert.strictEqual(isWork(new Date(2026, 8, 25)), false);
  // 2026-10-01 is National Day
  assert.strictEqual(isWork(new Date(2026, 9, 1)), false);
});

test('isWork() correctly identifies 2027 designated holidays', () => {
  // 2027-01-01 is New Year's Day (Friday)
  assert.strictEqual(isWork(new Date(2027, 0, 1)), false);
  // 2027-02-05 is Spring Festival Eve (Friday)
  assert.strictEqual(isWork(new Date(2027, 1, 5)), false);
  // 2027-04-03 is Qingming
  assert.strictEqual(isWork(new Date(2027, 3, 3)), false);
  // 2027-05-01 is Labor Day
  assert.strictEqual(isWork(new Date(2027, 4, 1)), false);
  // 2027-06-09 is Dragon Boat Festival (Wednesday)
  assert.strictEqual(isWork(new Date(2027, 5, 9)), false);
  // 2027-09-15 is Mid-Autumn Festival (Wednesday)
  assert.strictEqual(isWork(new Date(2027, 8, 15)), false);
  // 2027-10-01 is National Day (Friday)
  assert.strictEqual(isWork(new Date(2027, 9, 1)), false);
});

test('isWork() correctly identifies 2026 makeup workdays', () => {
  // 2026-01-04 is a Sunday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 0, 4)), true);
  // 2026-02-14 is a Saturday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 1, 14)), true);
  // 2026-02-28 is a Saturday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 1, 28)), true);
  // 2026-05-09 is a Saturday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 4, 9)), true);
  // 2026-09-20 is a Sunday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 8, 20)), true);
  // 2026-10-10 is a Saturday but a makeup workday
  assert.strictEqual(isWork(new Date(2026, 9, 10)), true);
});

test('isWork() correctly identifies 2027 makeup workdays', () => {
  // 2027-01-31 is a Sunday but a makeup workday for Spring Festival
  assert.strictEqual(isWork(new Date(2027, 0, 31)), true);
  // 2027-02-14 is a Sunday but a makeup workday for Spring Festival
  assert.strictEqual(isWork(new Date(2027, 1, 14)), true);
  // 2027-05-08 is a Saturday but a makeup workday for Labor Day
  assert.strictEqual(isWork(new Date(2027, 4, 8)), true);
  // 2027-09-26 is a Sunday but a makeup workday for National Day
  assert.strictEqual(isWork(new Date(2027, 8, 26)), true);
  // 2027-10-09 is a Saturday but a makeup workday for National Day
  assert.strictEqual(isWork(new Date(2027, 9, 9)), true);
});

test('DATA.w is a Set containing both 2026 and 2027 makeup days', () => {
  assert.strictEqual(DATA.w instanceof Set, true);
  assert.strictEqual(DATA.w.has('2026-01-04'), true);
  assert.strictEqual(DATA.w.has('2027-01-31'), true);
});

test('DATA.h contains expected holidays for both 2026 and 2027', () => {
  // 2026 holidays
  assert.strictEqual(DATA.h['2026-01-01'], '元旦');
  assert.strictEqual(DATA.h['2026-02-15'], '春节');
  assert.strictEqual(DATA.h['2026-10-01'], '国庆');

  // 2027 holidays
  assert.strictEqual(DATA.h['2027-01-01'], '元旦');
  assert.strictEqual(DATA.h['2027-02-05'], '春节');
  assert.strictEqual(DATA.h['2027-10-01'], '国庆');
});

test('smooth month navigation across year boundary in app logic', () => {
  // Mock globals for app.js test in Node
  global.document = {
    getElementById: () => null,
    querySelectorAll: () => [],
    body: { setAttribute: () => {}, removeAttribute: () => {}, getAttribute: () => null }
  };
  global.window = {};
  global.localStorage = { getItem: () => null, setItem: () => {} };
  global.DATA = DATA;
  global.fmt = fmt;
  global.isWork = isWork;

  const app = require('../app.js');
  app.setViewY(2026);
  app.setViewM(11); // 2026-12

  assert.strictEqual(app.viewY(), 2026);
  assert.strictEqual(app.viewM(), 11);

  // Transition next month: 2026-12 -> 2027-01
  app.changeMonth(1);
  assert.strictEqual(app.viewY(), 2027);
  assert.strictEqual(app.viewM(), 0);

  // Transition prev month: 2027-01 -> 2026-12
  app.changeMonth(-1);
  assert.strictEqual(app.viewY(), 2026);
  assert.strictEqual(app.viewM(), 11);
});

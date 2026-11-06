const test = require('node:test');
const assert = require('node:assert');
const { DATA, fmt, isWork } = require('../workday.js');

test('fmt() formats date correctly', () => {
  assert.strictEqual(fmt(new Date(2027, 0, 1)), '2027-01-01');
  assert.strictEqual(fmt(new Date(2027, 11, 31)), '2027-12-31');
  assert.strictEqual(fmt(new Date(2027, 2, 13)), '2027-03-13');
});

test('isWork() correctly identifies regular workdays', () => {
  // 2027-03-15 is a Monday
  assert.strictEqual(isWork(new Date(2027, 2, 15)), true);
  // 2027-03-16 is a Tuesday
  assert.strictEqual(isWork(new Date(2027, 2, 16)), true);
});

test('isWork() correctly identifies regular weekends', () => {
  // 2027-03-14 is a Sunday
  assert.strictEqual(isWork(new Date(2027, 2, 14)), false);
  // 2027-03-20 is a Saturday
  assert.strictEqual(isWork(new Date(2027, 2, 20)), false);
});

test('isWork() correctly identifies designated holidays', () => {
  // 2027-01-01 is New Year's Day (Friday)
  assert.strictEqual(isWork(new Date(2027, 0, 1)), false);
  // 2027-02-05 is Spring Festival Eve (Friday)
  assert.strictEqual(isWork(new Date(2027, 1, 5)), false);
  // 2027-04-05 is Qingming Holiday (Monday)
  assert.strictEqual(isWork(new Date(2027, 3, 5)), false);
  // 2027-05-03 is Labor Day Holiday (Monday)
  assert.strictEqual(isWork(new Date(2027, 4, 3)), false);
  // 2027-06-09 is Dragon Boat Festival (Wednesday)
  assert.strictEqual(isWork(new Date(2027, 5, 9)), false);
  // 2027-09-15 is Mid-Autumn Festival (Wednesday)
  assert.strictEqual(isWork(new Date(2027, 8, 15)), false);
  // 2027-10-01 is National Day (Friday)
  assert.strictEqual(isWork(new Date(2027, 9, 1)), false);
});

test('isWork() correctly identifies makeup workdays', () => {
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

test('DATA.w is a Set', () => {
  assert.strictEqual(DATA.w instanceof Set, true);
});

test('DATA.h contains expected holidays', () => {
  assert.strictEqual(DATA.h['2027-01-01'], '元旦');
  assert.strictEqual(DATA.h['2027-02-05'], '春节');
  assert.strictEqual(DATA.h['2027-04-03'], '清明');
  assert.strictEqual(DATA.h['2027-05-01'], '五一');
  assert.strictEqual(DATA.h['2027-06-09'], '端午');
  assert.strictEqual(DATA.h['2027-09-15'], '中秋');
  assert.strictEqual(DATA.h['2027-10-01'], '国庆');
});

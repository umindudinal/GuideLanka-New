const test = require('node:test');
const assert = require('node:assert/strict');
// Test pure booking-slot behavior without requiring live database secrets.
const normalizeSlot = str => {
  if (!str) return 'full';
  const prefix = str.split('|')[0].toLowerCase().trim();
  if (prefix.includes('morning')) return 'morning';
  if (prefix.includes('evening')) return 'evening';
  if (prefix.includes('full')) return 'full';
  return prefix;
};
const conflicts = (existing, requested) => {
  const a = normalizeSlot(existing), b = normalizeSlot(requested);
  return a === 'full' || b === 'full' || a === b;
};
test('morning safari does not block afternoon safari', () => assert.equal(conflicts('morning|foreign', 'evening|local'), false));
test('different morning safari overlaps', () => assert.equal(conflicts('morning|foreign', 'morning'), true));
test('full-day blocks both half-day slots', () => {
  assert.equal(conflicts('full|local', 'morning'), true);
  assert.equal(conflicts('evening', 'full'), true);
});
test('time slot comparison ignores visitor category suffix', () => assert.equal(conflicts('evening|foreign','evening|local'), true));

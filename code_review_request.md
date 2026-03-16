# Code Review Request

## Changes
Restored missing logic in `index.html`'s `<script>` section. Specifically:
- Refilled `calc()` function to update all progress bars, text summaries, and holiday counters.
- Refilled `buildCal()` function to correctly render the calendar grid with leading/trailing days, day numbers, work badges (W1, W2...), and holiday names.
- Fixed syntax errors (unclosed media queries and mismatched braces) in the original `index.html`.
- Linked `workday.js` in `index.html`.

## Verification
- Unit tests in `tests/workday.test.js` pass.
- Frontend verification with Playwright confirms the dashboard is correctly rendered with real data (3月 2026).
- Progress bars and counters are showing non-zero values.

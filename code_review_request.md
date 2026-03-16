# Code Review Request - Highlight W6/W15 and Fix Holiday List

## Summary
Fixed two issues in the 2026 Workday Dashboard (Contrast theme):
1. **W6/W15 Highlighting**: Added CSS class assignment in `buildCal` to highlight the 6th and 15th workdays of the month.
2. **Holiday List**: Implemented the missing `updateHolidays` function to display upcoming holiday ranges and calculate the number of workdays remaining until each holiday.

## Changes
- **index.html**:
  - Modified `buildCal` loop to add `day-w6` and `day-w15` classes based on `wCnt`.
  - Added `updateHolidays` function.
  - Updated script initialization and `saveNote` to call `updateHolidays`.

## Verification Results
- **Unit Tests**: All 7 tests in `tests/workday.test.js` passed.
- **Frontend Verification**:
  - Playwright confirmed presence of `.day-w6` and `.day-w15` elements.
  - Playwright confirmed `holiday-list` is populated with content.
  - Visual verification via screenshot `/home/jules/verification/verification.png`.

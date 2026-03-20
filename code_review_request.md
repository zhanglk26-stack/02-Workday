# Code Review Request: Fix Style Conflict Between .day-today and .day-w15/w6

## Problem
When a date is both the "today" date and a special workday (W6 or W15), the CSS rules for `.day-w6` and `.day-w15` were taking precedence over `.day-today` because they were defined later in the stylesheet and both used `!important`. This caused a low-contrast UI where white text was displayed on a light background.

## Solution
- Moved the `.day-today` CSS rule to the end of the calendar style section to ensure it has the highest precedence among state-based styles.
- Added a `border: 2px solid var(--primary) !important` to the `.day-today` rule to ensure it consistently overrides the colored borders of `.day-w6` and `.day-w15`.

## Verification
- Verified visually using Playwright by mocking the date to March 20, 2026 (W15).
- Confirmed that the "today" highlight (blue background, white text) now correctly applies over the W15 styling.
- Ran existing unit tests (`node --test tests/workday.test.js`) to ensure no logic regressions.

# Recovery checkpoint — 2026-11-17

Published at the owner's request to preserve current work. Not ready to merge.

Changes include session generation guards, clearing account caches on identity
changes, retryable lesson/quiz writes, preserving demo project edits across reads,
Unicode-safe native session chunks and size validation, and web-compatible
Animated.Value initialization. Demo data remains temporary and is labelled so.
Dependencies and patch verification are updated; CI keeps browser sandboxing.

## Completed checks

- Lint/type checking passed, including the final animation compatibility change.
- 39 Jest tests passed before the final animation change; focused screen suite
  passed (10 tests), with React animation act warnings still to clean up.
- 19 dependency security tests and four Expo toolchain regressions passed.
- Live npm audit reported zero after updates, versus 33 findings before.
- Actual disposable Supabase Auth/PostgREST: 11 tests passed; PostgreSQL policies:
  25 passed. These are local service tests, not hosted/device evidence.
- Web export passed. Browser reached dashboard, created/edited a task and showed
  the missing-lesson error. The suite FAILS its page-error assertion due to React
  hydration error #418; no assertion was disabled.
- Independent reviews checked account isolation and quiz error handling and
  identified issues subsequently fixed. Final changes still need full re-review.

## Required before merge

Fix hydration, rerun complete tests on the final tree, extend browser coverage
for project rereads/logout and real Supabase sign-in events, and verify final-SHA
CI. Test partial quiz save/progress failure retry. Native Android/iOS execution
remains unverified. Progress writes still use client snapshots: concurrent tabs
may overwrite progress; atomic backend updates are not implemented.

No deployment or default-branch merge was performed. This checkpoint does not
claim completion of the remaining portfolio repositories.

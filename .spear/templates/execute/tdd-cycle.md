# TDD Cycle Record

**Task:** [PHASE-NNN.T-NN]
**Behavior under test:** [One sentence describing the behavior]

## RED — Write Failing Test

```
Test: [test name]
File: [test file path]
Assertion: [what the test asserts]
```

**Ran test:** [ ] Yes
**Test failed:** [ ] Yes — for the RIGHT reason (missing feature, not syntax error)
**Failure message:** [paste the actual failure output]

> If the test passes immediately, you are testing existing functionality.
> Rewrite the test to target the NEW behavior.

## GREEN — Minimal Implementation

```
File: [implementation file path]
Change: [what was written — describe, don't paste entire file]
```

**Ran test:** [ ] Yes
**Test passes:** [ ] Yes
**All other tests still pass:** [ ] Yes
**Clean output (no warnings):** [ ] Yes

> Write the SIMPLEST code that makes the test pass.
> No feature additions beyond what the test requires.
> No refactoring of other code. Not yet.

## REFACTOR — Clean Up (only after GREEN)

- [ ] Removed duplication
- [ ] Improved naming
- [ ] Extracted helpers (only if warranted)
- [ ] All tests still pass after refactoring

> If no refactoring needed, write "N/A — code is already clean."

## Verification

- [ ] Every function/method has a corresponding test
- [ ] Observed the test fail before writing implementation
- [ ] Test failed for the correct reason (missing feature, not error)
- [ ] Minimal code written to pass the test
- [ ] All tests passing (new + existing)
- [ ] Clean output (no errors/warnings)
- [ ] Tests use real code (mocks only when unavoidable)
- [ ] Edge cases covered

> If you cannot check ALL boxes, TDD was not followed. Start over.

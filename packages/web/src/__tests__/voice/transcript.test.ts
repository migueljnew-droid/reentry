import { describe, it, expect } from 'vitest';
import {
  createSession,
  advanceSession,
  parseName,
  parseReleaseDate,
  parseStateCode,
  parseReleaseType as _parseReleaseType,
  parseList,
  type IntakeSession,
} from '@/lib/voice/transcript';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSession(): IntakeSession {
  return createSession('test-session-001');
}

/** Walk the FSM through a full happy-path intake. */
function runHappyPath(): IntakeSession {
  let s = makeSession();
  // greeting
  s = advanceSession(s, 'yes').nextSession;
  // name
  s = advanceSession(s, 'My name is John Smith').nextSession;
  // release_date
  s = advanceSession(s, 'January 5, 2024').nextSession;
  // state
  s = advanceSession(s, 'Georgia').nextSession;
  // release_type
  s = advanceSession(s, 'parole').nextSession;
  // obligations
  s = advanceSession(s, 'weekly parole check-in, drug test').nextSession;
  // benefits_needed
  s = advanceSession(s, 'housing, food, ID').nextSession;
  // employment_goals
  s = advanceSession(s, 'construction or driving').nextSession;
  // summary — confirm
  s = advanceSession(s, 'yes').nextSession;
  return s;
}

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------
describe('createSession', () => {
  it('starts in greeting state with empty collected data', () => {
    const s = makeSession();
    expect(s.currentState).toBe('greeting');
    expect(s.turns).toHaveLength(0);
    expect(s.collected).toEqual({});
    expect(s.retryCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Happy path — full FSM traversal
// ---------------------------------------------------------------------------
describe('advanceSession — happy path', () => {
  it('reaches done state after all inputs', () => {
    const final = runHappyPath();
    expect(final.currentState).toBe('done');
  });

  it('sets done=true in AdvanceResult on last transition', () => {
    let s = makeSession();
    s = advanceSession(s, 'yes').nextSession; // greeting→name
    s = advanceSession(s, 'Jane Doe').nextSession;
    s = advanceSession(s, '03/15/2024').nextSession;
    s = advanceSession(s, 'TX').nextSession;
    s = advanceSession(s, 'probation').nextSession;
    s = advanceSession(s, 'none').nextSession;
    s = advanceSession(s, 'food, phone').nextSession;
    s = advanceSession(s, 'cooking').nextSession;
    const result = advanceSession(s, 'yes that is correct');
    expect(result.done).toBe(true);
  });

  it('collects name correctly', () => {
    const final = runHappyPath();
    expect(final.collected.name).toBe('John Smith');
  });

  it('collects releaseDate as YYYY-MM-DD', () => {
    const final = runHappyPath();
    expect(final.collected.releaseDate).toBe('2024-01-05');
  });

  it('collects releaseState as 2-letter code', () => {
    const final = runHappyPath();
    expect(final.collected.releaseState).toBe('GA');
  });

  it('collects releaseType', () => {
    const final = runHappyPath();
    expect(final.collected.releaseType).toBe('parole');
  });

  it('collects obligations as array', () => {
    const final = runHappyPath();
    expect(final.collected.obligations).toContain('weekly parole check-in');
  });

  it('collects benefitsNeeded as array', () => {
    const final = runHappyPath();
    expect(final.collected.benefitsNeeded).toEqual(
      expect.arrayContaining(['housing', 'food', 'ID'])
    );
  });

  it('collects employmentGoals as string', () => {
    const final = runHappyPath();
    expect(final.collected.employmentGoals).toContain('construction');
  });

  it('accumulates turns (user + assistant per advance)', () => {
    const final = runHappyPath();
    // 9 advances × 2 turns each = 18
    expect(final.turns.length).toBe(18);
  });
});

// ---------------------------------------------------------------------------
// parseName
// ---------------------------------------------------------------------------
describe('parseName', () => {
  it('strips "my name is" prefix', () => {
    expect(parseName('my name is Marcus Reed')).toBe('Marcus Reed');
  });

  it('strips "I am" prefix', () => {
    expect(parseName("I am Darius Jones")).toBe('Darius Jones');
  });

  it('returns null for single character', () => {
    expect(parseName('J')).toBeNull();
  });

  it('title-cases the name', () => {
    expect(parseName('john doe')).toBe('John Doe');
  });
});

// ---------------------------------------------------------------------------
// parseReleaseDate
// ---------------------------------------------------------------------------
describe('parseReleaseDate', () => {
  it('parses ISO format', () => {
    expect(parseReleaseDate('2024-03-15')).toBe('2024-03-15');
  });

  it('parses MM/DD/YYYY', () => {
    expect(parseReleaseDate('03/15/2024')).toBe('2024-03-15');
  });

  it('parses spoken month name', () => {
    expect(parseReleaseDate('March 15, 2024')).toBe('2024-03-15');
  });

  it('returns null for garbage input', () => {
    expect(parseReleaseDate('yesterday')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseStateCode
// ---------------------------------------------------------------------------
describe('parseStateCode', () => {
  it('accepts 2-letter code directly', () => {
    expect(parseStateCode('GA')).toBe('GA');
  });

  it('accepts full state name', () => {
    expect(parseStateCode('Georgia')).toBe('GA');
  });

  it('accepts FED for federal supervision', () => {
    expect(parseStateCode('FED')).toBe('FED');
  });

  it('returns null for invalid state', () => {
    expect(parseStateCode('XZ')).toBeNull();
  });

  it('extracts state from sentence', () => {
    expect(parseStateCode("I'm from Texas")).toBe('TX');
  });
});

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------
describe('retry logic', () => {
  it('stays on same state when input is invalid', () => {
    let s = makeSession();
    s = advanceSession(s, 'yes').nextSession; // greeting→name
    const result = advanceSession(s, '???'); // invalid name
    expect(result.nextSession.currentState).toBe('name');
    expect(result.nextSession.retryCount).toBe(1);
  });

  it('increments retryCount on repeated failure', () => {
    let s = makeSession();
    s = advanceSession(s, 'yes').nextSession;
    s = advanceSession(s, '???').nextSession; // retry 1
    const result = advanceSession(s, '???'); // retry 2
    expect(result.nextSession.retryCount).toBe(2);
  });

  it('resets retryCount after successful input', () => {
    let s = makeSession();
    s = advanceSession(s, 'yes').nextSession;
    s = advanceSession(s, '???').nextSession; // retry
    s = advanceSession(s, 'John Smith').nextSession; // success
    expect(s.retryCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseList
// ---------------------------------------------------------------------------
describe('parseList', () => {
  it('splits comma-separated items', () => {
    expect(parseList('housing, food, ID')).toEqual(['housing', 'food', 'ID']);
  });

  it('splits on "and"', () => {
    expect(parseList('housing and food')).toEqual(['housing', 'food']);
  });

  it('returns single item array for single word', () => {
    expect(parseList('housing')).toEqual(['housing']);
  });
});

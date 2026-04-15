/**
 * Voice Intake FSM — pure, no I/O, fully testable.
 *
 * States flow linearly: greeting → name → release_date → state →
 * release_type → obligations → benefits_needed → employment_goals →
 * summary → done
 *
 * advanceSession() is the only public mutation surface.
 */

export type IntakeState =
  | 'greeting'
  | 'name'
  | 'release_date'
  | 'state'
  | 'release_type'
  | 'obligations'
  | 'benefits_needed'
  | 'employment_goals'
  | 'summary'
  | 'done';

export interface VoiceTurn {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string; // ISO-8601
  audioRef?: string; // S3/Supabase storage key, optional
}

export interface CollectedData {
  name?: string;
  releaseDate?: string;   // YYYY-MM-DD
  releaseState?: string;  // 2-letter code or FED
  releaseType?: string;   // 'parole' | 'probation' | 'time_served' | 'other'
  obligations?: string[];
  benefitsNeeded?: string[];
  employmentGoals?: string;
}

export interface IntakeSession {
  sessionId: string;
  currentState: IntakeState;
  turns: VoiceTurn[];
  collected: CollectedData;
  retryCount: number;     // retries on current state
  createdAt: string;      // ISO-8601
  updatedAt: string;      // ISO-8601
}

export interface AdvanceResult {
  nextSession: IntakeSession;
  assistantReply: string;
  collected: CollectedData;
  done: boolean;
}

// ---------------------------------------------------------------------------
// State transition order
// ---------------------------------------------------------------------------
const STATE_ORDER: IntakeState[] = [
  'greeting',
  'name',
  'release_date',
  'state',
  'release_type',
  'obligations',
  'benefits_needed',
  'employment_goals',
  'summary',
  'done',
];

function nextState(current: IntakeState): IntakeState {
  const idx = STATE_ORDER.indexOf(current);
  return STATE_ORDER[Math.min(idx + 1, STATE_ORDER.length - 1)];
}

// ---------------------------------------------------------------------------
// Parsers — extract structured data from free-form speech
// ---------------------------------------------------------------------------

/** Normalise a spoken name: trim, title-case first word. */
export function parseName(text: string): string | null {
  const trimmed = text.trim().replace(/^(my name is|i'm|i am|call me)\s+/i, '');
  if (trimmed.length < 2 || trimmed.length > 80) return null;
  // Must contain at least 2 alphabetic characters — rejects pure punctuation
  // ("???") and numeric-only inputs while still accepting hyphenated + apostrophe names.
  const alphaCount = (trimmed.match(/\p{L}/gu) ?? []).length;
  if (alphaCount < 2) return null;
  return trimmed
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/** Parse a date from common spoken forms → YYYY-MM-DD or null. */
export function parseReleaseDate(text: string): string | null {
  // Try ISO first
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(iso[0]);
    if (!isNaN(d.getTime())) return iso[0];
  }
  // MM/DD/YYYY or M/D/YYYY
  const mdy = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) {
    const [, m, d, y] = mdy;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  // Month name: "January 5 2024" or "Jan 5, 2024"
  const named = text.match(
    /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})[,\s]+(\d{4})/i
  );
  if (named) {
    const d = new Date(`${named[1]} ${named[2]}, ${named[3]}`);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

const VALID_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY','DC','FED',
]);

/** Extract a 2-letter state code or FED from speech. */
export function parseStateCode(text: string): string | null {
  const upper = text.toUpperCase().trim();
  // Direct match
  if (VALID_STATES.has(upper)) return upper;
  // Embedded: "I'm from Georgia" → GA
  const stateNames: Record<string, string> = {
    ALABAMA:'AL',ALASKA:'AK',ARIZONA:'AZ',ARKANSAS:'AR',CALIFORNIA:'CA',
    COLORADO:'CO',CONNECTICUT:'CT',DELAWARE:'DE',FLORIDA:'FL',GEORGIA:'GA',
    HAWAII:'HI',IDAHO:'ID',ILLINOIS:'IL',INDIANA:'IN',IOWA:'IA',KANSAS:'KS',
    KENTUCKY:'KY',LOUISIANA:'LA',MAINE:'ME',MARYLAND:'MD',MASSACHUSETTS:'MA',
    MICHIGAN:'MI',MINNESOTA:'MN',MISSISSIPPI:'MS',MISSOURI:'MO',MONTANA:'MT',
    NEBRASKA:'NE',NEVADA:'NV','NEW HAMPSHIRE':'NH','NEW JERSEY':'NJ',
    'NEW MEXICO':'NM','NEW YORK':'NY','NORTH CAROLINA':'NC','NORTH DAKOTA':'ND',
    OHIO:'OH',OKLAHOMA:'OK',OREGON:'OR',PENNSYLVANIA:'PA','RHODE ISLAND':'RI',
    'SOUTH CAROLINA':'SC','SOUTH DAKOTA':'SD',TENNESSEE:'TN',TEXAS:'TX',
    UTAH:'UT',VERMONT:'VT',VIRGINIA:'VA',WASHINGTON:'WA','WEST VIRGINIA':'WV',
    WISCONSIN:'WI',WYOMING:'WY','DISTRICT OF COLUMBIA':'DC',FEDERAL:'FED',
  };
  for (const [name, code] of Object.entries(stateNames)) {
    if (upper.includes(name)) return code;
  }
  // Try embedded 2-letter word
  const match = upper.match(/\b([A-Z]{2})\b/);
  if (match && VALID_STATES.has(match[1])) return match[1];
  return null;
}

/** Normalise release type from speech. */
export function parseReleaseType(
  text: string
): 'parole' | 'probation' | 'time_served' | 'other' | null {
  const lower = text.toLowerCase();
  if (lower.includes('parole')) return 'parole';
  if (lower.includes('probation')) return 'probation';
  if (
    lower.includes('time served') ||
    lower.includes('maxed out') ||
    lower.includes('discharged') ||
    lower.includes('flat')
  )
    return 'time_served';
  if (lower.includes('other') || lower.includes('not sure') || lower.includes('unsure'))
    return 'other';
  return null;
}

/** Split a comma/and-separated list of needs into an array. */
export function parseList(text: string): string[] {
  return text
    .split(/,|\band\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

// ---------------------------------------------------------------------------
// Reply builders — import prompts lazily to keep this file pure
// ---------------------------------------------------------------------------
import { getPrompt, getRetryPrompt, buildSummary } from './prompts';

// ---------------------------------------------------------------------------
// Core FSM
// ---------------------------------------------------------------------------

/** Create a fresh session. */
export function createSession(sessionId: string): IntakeSession {
  const now = new Date().toISOString();
  return {
    sessionId,
    currentState: 'greeting',
    turns: [],
    collected: {},
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Pure FSM transition.
 * Takes the current session + user's spoken text.
 * Returns the next session state, the assistant's reply, and collected data.
 */
export function advanceSession(
  session: IntakeSession,
  userText: string,
  audioRef?: string
): AdvanceResult {
  const now = new Date().toISOString();
  const userTurn: VoiceTurn = { role: 'user', text: userText, timestamp: now, audioRef };

  const collected = { ...session.collected };
  let assistantReply: string;
  let moveForward = false;
  let retryCount = session.retryCount;

  switch (session.currentState) {
    case 'greeting': {
      // Greeting just needs any acknowledgement to proceed
      moveForward = true;
      assistantReply = getPrompt('name', collected);
      break;
    }

    case 'name': {
      const name = parseName(userText);
      if (name) {
        collected.name = name;
        moveForward = true;
        assistantReply = getPrompt('release_date', collected);
      } else {
        retryCount++;
        assistantReply = getRetryPrompt('name', retryCount);
      }
      break;
    }

    case 'release_date': {
      const date = parseReleaseDate(userText);
      if (date) {
        collected.releaseDate = date;
        moveForward = true;
        assistantReply = getPrompt('state', collected);
      } else {
        retryCount++;
        assistantReply = getRetryPrompt('release_date', retryCount);
      }
      break;
    }

    case 'state': {
      const code = parseStateCode(userText);
      if (code) {
        collected.releaseState = code;
        moveForward = true;
        assistantReply = getPrompt('release_type', collected);
      } else {
        retryCount++;
        assistantReply = getRetryPrompt('state', retryCount);
      }
      break;
    }

    case 'release_type': {
      const rt = parseReleaseType(userText);
      if (rt) {
        collected.releaseType = rt;
        moveForward = true;
        assistantReply = getPrompt('obligations', collected);
      } else {
        retryCount++;
        assistantReply = getRetryPrompt('release_type', retryCount);
      }
      break;
    }

    case 'obligations': {
      // Accept any answer (even "none")
      const items = parseList(userText);
      collected.obligations = items.length ? items : ['none'];
      moveForward = true;
      assistantReply = getPrompt('benefits_needed', collected);
      break;
    }

    case 'benefits_needed': {
      const items = parseList(userText);
      collected.benefitsNeeded = items.length ? items : ['none'];
      moveForward = true;
      assistantReply = getPrompt('employment_goals', collected);
      break;
    }

    case 'employment_goals': {
      collected.employmentGoals = userText.trim().slice(0, 500);
      moveForward = true;
      assistantReply = buildSummary(collected);
      break;
    }

    case 'summary': {
      // User confirms or corrects — for now accept any reply and finish
      moveForward = true;
      assistantReply =
        'Great! Your information is saved. We will build your action plan now. ' +
        'You can ask me anything at any time.';
      break;
    }

    case 'done': {
      assistantReply = 'Your intake is already complete. Your action plan is being prepared.';
      break;
    }

    default: {
      assistantReply = 'I did not understand that. Can you say it again?';
    }
  }

  const assistantTurn: VoiceTurn = {
    role: 'assistant',
    text: assistantReply,
    timestamp: new Date().toISOString(),
  };

  const newState = moveForward ? nextState(session.currentState) : session.currentState;

  const nextSession: IntakeSession = {
    ...session,
    currentState: newState,
    turns: [...session.turns, userTurn, assistantTurn],
    collected,
    retryCount: moveForward ? 0 : retryCount,
    updatedAt: new Date().toISOString(),
  };

  return {
    nextSession,
    assistantReply,
    collected,
    done: newState === 'done',
  };
}

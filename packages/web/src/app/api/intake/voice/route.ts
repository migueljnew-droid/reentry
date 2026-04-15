/**
 * POST /api/intake/voice
 *
 * Drives the voice intake FSM one turn at a time.
 *
 * Request body:
 *   { sessionId: string, userText: string, audioRef?: string }
 *
 * Response:
 *   { assistantReply: string, done: boolean, collected: CollectedData,
 *     sessionId: string, currentState: string }
 *
 * Session store: in-memory Map (swap for Supabase in production).
 * Sessions expire after 30 minutes of inactivity.
 */

import { z } from 'zod';
import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow, ValidationError } from '@/lib/validation/schemas';
import {
  createSession,
  advanceSession,
  type IntakeSession,
} from '@/lib/voice/transcript';
import { GREETING_PROMPT as _GREETING_PROMPT } from '@/lib/voice/prompts';

// ---------------------------------------------------------------------------
// Zod schema for this route
// ---------------------------------------------------------------------------
const VoiceTurnSchema = z.object({
  sessionId: z
    .string()
    .min(1, 'sessionId is required')
    .max(128, 'sessionId too long'),
  userText: z
    .string()
    .min(1, 'userText is required')
    .max(2000, 'userText too long'),
  audioRef: z.string().max(512).optional(),
});

type VoiceTurnInput = z.infer<typeof VoiceTurnSchema>;

// ---------------------------------------------------------------------------
// In-memory session store (replace with Supabase for production)
// ---------------------------------------------------------------------------
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoredSession {
  session: IntakeSession;
  lastAccessedAt: number;
}

const sessionStore = new Map<string, StoredSession>();

function getOrCreateSession(sessionId: string): IntakeSession {
  const stored = sessionStore.get(sessionId);
  if (stored) {
    stored.lastAccessedAt = Date.now();
    return stored.session;
  }
  const fresh = createSession(sessionId);
  sessionStore.set(sessionId, { session: fresh, lastAccessedAt: Date.now() });
  return fresh;
}

function saveSession(session: IntakeSession): void {
  sessionStore.set(session.sessionId, {
    session,
    lastAccessedAt: Date.now(),
  });
}

/** Evict sessions older than TTL (called on each request, cheap). */
function evictExpired(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, stored] of sessionStore.entries()) {
    if (stored.lastAccessedAt < cutoff) sessionStore.delete(id);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export const POST = withErrorHandler(async (req: Request) => {
  evictExpired();

  const body = await req.json().catch(() => {
    throw new ValidationError([{ path: [], message: 'Invalid JSON body', code: 'invalid_type', input: undefined } as unknown as never]);
  });

  const input: VoiceTurnInput = parseOrThrow(VoiceTurnSchema, body);

  const session = getOrCreateSession(input.sessionId);

  // If session is brand-new (greeting state, no turns yet), return greeting
  if (session.currentState === 'greeting' && session.turns.length === 0) {
    // Advance past greeting automatically so next call gets name prompt
    const result = advanceSession(session, input.userText, input.audioRef);
    saveSession(result.nextSession);
    return Response.json({
      sessionId: input.sessionId,
      assistantReply: result.assistantReply,
      done: result.done,
      collected: result.collected,
      currentState: result.nextSession.currentState,
    });
  }

  const result = advanceSession(session, input.userText, input.audioRef);
  saveSession(result.nextSession);

  return Response.json({
    sessionId: input.sessionId,
    assistantReply: result.assistantReply,
    done: result.done,
    collected: result.collected,
    currentState: result.nextSession.currentState,
  });
});

/**
 * GET /api/intake/voice?sessionId=xxx
 * Returns current session state (for resuming after page reload).
 */
export const GET = withErrorHandler(async (req: Request) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId || sessionId.length < 1) {
    throw new ValidationError([
      { path: ['sessionId'], message: 'sessionId query param is required', code: 'invalid_type' } as unknown as never,
    ]);
  }

  const stored = sessionStore.get(sessionId);
  if (!stored) {
    return Response.json(
      { error: 'Session not found', sessionId },
      { status: 404 }
    );
  }

  const { session } = stored;
  return Response.json({
    sessionId,
    currentState: session.currentState,
    done: session.currentState === 'done',
    collected: session.collected,
    turnCount: session.turns.length,
  });
});

// Next.js route files only allow HTTP handler exports — sessionStore lives
// in a sibling module so tests can reach it without tripping the route-type
// contract.

/**
 * Voice intake prompt templates.
 *
 * Rules:
 * - 5th-grade reading level (Flesch-Kincaid ≤ 60)
 * - Short sentences. One question at a time.
 * - Confirm what was heard before moving on.
 * - Offer examples when a format is needed.
 * - Never use jargon.
 */

import type { CollectedData, IntakeState } from './transcript';

type PromptableState = Exclude<IntakeState, 'greeting' | 'done'>;

// ---------------------------------------------------------------------------
// Initial prompts — one per state
// ---------------------------------------------------------------------------
const PROMPTS: Record<PromptableState, (data: CollectedData) => string> = {
  name: () =>
    "Hi! I'm here to help you get back on your feet. " +
    "Let's start simple. What is your first and last name?",

  release_date: (d) =>
    `Thanks, ${d.name ?? 'friend'}! ` +
    "When did you get out? Just tell me the month, day, and year. " +
    "For example, say: January 5, 2024.",

  state: (d) =>
    `Got it — you got out on ${d.releaseDate ?? 'that date'}. ` +
    "What state are you in right now? Just say the name of the state. " +
    "For example: Georgia, Texas, or California.",

  release_type: (d) =>
    `Okay, ${d.releaseState ?? 'your state'}. ` +
    "Are you on parole, on probation, or did you finish your full sentence? " +
    "You can say: parole, probation, time served, or I'm not sure.",

  obligations: (d) =>
    `Got it — ${d.releaseType ?? 'understood'}. ` +
    "Do you have any check-ins or court dates coming up? " +
    "For example: parole check-in every week, drug test, or none. " +
    "Just list what you know.",

  benefits_needed: () =>
    "What do you need most right now? " +
    "For example: housing, food, ID, health care, phone, job training. " +
    "Say as many as you need.",

  employment_goals: (d) =>
    `Okay${d.name ? ', ' + d.name : ''}. ` +
    "What kind of work are you looking for? " +
    "You can say a job type, like: construction, cooking, driving, or office work. " +
    "Or just say: I don't know yet — that's fine too.",

  summary: (d) => buildSummary(d),
};

// ---------------------------------------------------------------------------
// Retry prompts — gentler, offer more examples
// ---------------------------------------------------------------------------
const RETRY_PROMPTS: Record<PromptableState, (attempt: number) => string> = {
  name: (n) =>
    n === 1
      ? "I didn't catch your name. Can you say your first and last name again?"
      : "No problem. Just say your name — for example: John Smith.",

  release_date: (n) =>
    n === 1
      ? "I didn't get the date. Can you say it again? " +
        "Try: month, day, year — like March 10, 2024."
      : "Let's try a different way. Say the numbers: 3 slash 10 slash 2024.",

  state: (n) =>
    n === 1
      ? "I didn't catch the state. Say the full name — like Georgia or Texas."
      : "You can also say the two letters — like G-A for Georgia, or T-X for Texas.",

  release_type: (n) =>
    n === 1
      ? "I didn't understand that. Are you on parole, probation, or did you finish your full time?"
      : "Just pick one: parole, probation, time served, or not sure.",

  obligations: () =>
    "No worries. Do you have any required check-ins or meetings? " +
    "If not, just say: none.",

  benefits_needed: () =>
    "What do you need help with? Housing, food, ID, health care? " +
    "Say as many as you like, or say: I'm not sure.",

  employment_goals: () =>
    "What kind of work are you interested in? " +
    "Or say: I don't know yet — that works too.",

  summary: () => "Let me read that back to you one more time.",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

export function getPrompt(state: PromptableState, data: CollectedData): string {
  return PROMPTS[state](data);
}

export function getRetryPrompt(state: PromptableState, attempt: number): string {
  return RETRY_PROMPTS[state](attempt);
}

/** Build a plain-English summary of everything collected so far. */
export function buildSummary(data: CollectedData): string {
  const lines: string[] = ['Okay, let me read back what I have so far.'];

  if (data.name) lines.push(`Your name is ${data.name}.`);
  if (data.releaseDate) lines.push(`You got out on ${data.releaseDate}.`);
  if (data.releaseState) lines.push(`You are in ${data.releaseState}.`);
  if (data.releaseType) {
    const label =
      data.releaseType === 'time_served'
        ? 'you finished your full sentence'
        : `you are on ${data.releaseType}`;
    lines.push(`It sounds like ${label}.`);
  }
  if (data.obligations?.length) {
    lines.push(`Your obligations: ${data.obligations.join(', ')}.`);
  }
  if (data.benefitsNeeded?.length) {
    lines.push(`You need help with: ${data.benefitsNeeded.join(', ')}.`);
  }
  if (data.employmentGoals) {
    lines.push(`For work, you said: ${data.employmentGoals}.`);
  }

  lines.push(
    'Does that sound right? Say yes to continue, or tell me what to fix.'
  );

  return lines.join(' ');
}

/** The very first thing the assistant says when a session starts. */
export const GREETING_PROMPT =
  "Hello! Welcome to REENTRY. I am here to help you get your life back on track. " +
  "I will ask you a few simple questions. Take your time. " +
  "There are no wrong answers. Ready? Just say yes or go ahead.";

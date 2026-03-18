/**
 * PII scrubbing utilities for Sentry events.
 *
 * Scrubs values from keys matching sensitive patterns to prevent
 * justice-involved individuals' personal data from reaching Sentry.
 */

/** PII key pattern — matches keys that may contain sensitive data */
export const PII_KEY_PATTERN = /name|conviction|transcript|supervision|ssn|family/i;

/** Replacement value for scrubbed PII */
export const REDACTED = '[REDACTED]';

/**
 * Recursively scrub PII from an object's values based on key names.
 * Keys matching PII_KEY_PATTERN have their values replaced with '[REDACTED]'.
 * Nested objects are recursively scrubbed. Arrays are left as-is.
 */
export function scrubPII(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEY_PATTERN.test(key)) {
      scrubbed[key] = REDACTED;
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      scrubbed[key] = scrubPII(value as Record<string, unknown>);
    } else {
      scrubbed[key] = value;
    }
  }
  return scrubbed;
}

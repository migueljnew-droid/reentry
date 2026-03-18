import * as Sentry from '@sentry/nextjs';
import { scrubPII, PII_KEY_PATTERN, REDACTED } from './src/lib/sentry-pii';

/**
 * Sentry client-side configuration.
 * Only initializes if SENTRY_DSN is available at build time.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    beforeSend(event) {
      // Scrub PII from extra data
      if (event.extra) {
        event.extra = scrubPII(event.extra as Record<string, unknown>);
      }

      // Scrub PII from exception values
      if (event.exception?.values) {
        for (const exception of event.exception.values) {
          if (exception.value) {
            exception.value = exception.value.replace(
              PII_KEY_PATTERN,
              REDACTED
            );
          }
        }
      }

      // Scrub PII from breadcrumbs
      if (event.breadcrumbs) {
        for (const breadcrumb of event.breadcrumbs) {
          if (breadcrumb.data) {
            breadcrumb.data = scrubPII(breadcrumb.data as Record<string, unknown>);
          }
          if (breadcrumb.message) {
            breadcrumb.message = breadcrumb.message.replace(
              PII_KEY_PATTERN,
              REDACTED
            );
          }
        }
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.data) {
        breadcrumb.data = scrubPII(breadcrumb.data as Record<string, unknown>);
      }
      return breadcrumb;
    },
  });
}

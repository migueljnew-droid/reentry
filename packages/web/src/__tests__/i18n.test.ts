import { describe, it, expect } from 'vitest';
import { t, detectLocale, type Locale } from '@/lib/i18n';

// ==========================================
// i18n translation tests
// ==========================================

describe('t (translate)', () => {
  it('returns English translation by default', () => {
    expect(t('hero.title')).toBe('You did your time.');
  });

  it('returns English translation with explicit locale', () => {
    expect(t('hero.title', 'en')).toBe('You did your time.');
  });

  it('returns Spanish translation', () => {
    expect(t('hero.title', 'es')).toBe('Ya cumpliste tu condena.');
  });

  it('returns the key itself for unknown keys', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns English fallback for unknown keys in Spanish', () => {
    expect(t('nonexistent.key', 'es')).toBe('nonexistent.key');
  });

  it('translates all critical intake keys', () => {
    const intakeKeys = [
      'intake.welcome',
      'intake.state',
      'intake.conviction',
      'intake.release_date',
      'intake.needs',
      'intake.family',
      'intake.skills',
      'intake.supervision',
      'intake.review',
      'intake.generating',
      'intake.continue',
      'intake.back',
      'intake.build_plan',
    ];

    for (const key of intakeKeys) {
      const en = t(key, 'en');
      const es = t(key, 'es');
      // Both should resolve to actual text, not the key itself
      expect(en).not.toBe(key);
      expect(es).not.toBe(key);
      // English and Spanish should differ
      expect(en).not.toBe(es);
    }
  });

  it('translates CTA button text', () => {
    expect(t('hero.cta', 'en')).toContain('Free');
    expect(t('hero.cta', 'es')).toContain('Gratis');
  });

  it('translates footer text', () => {
    expect(t('footer.by', 'en')).toContain('FathersCAN');
    expect(t('footer.by', 'es')).toContain('FathersCAN');
  });
});

describe('detectLocale', () => {
  it('returns "en" on the server (no window)', () => {
    // In Node.js test environment, window is undefined
    const locale = detectLocale();
    expect(locale).toBe('en');
  });
});

// ==========================================
// Locale type validation
// ==========================================

describe('Locale type', () => {
  it('supports en and es', () => {
    const locales: Locale[] = ['en', 'es'];
    expect(locales).toHaveLength(2);
  });
});

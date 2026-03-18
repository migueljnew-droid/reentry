'use client';

/**
 * Skip-to-content link for keyboard navigation (WCAG 2.1 AA).
 * Visually hidden until focused, then appears at the top of the page.
 * Already included in RootLayout — this component is available for
 * sub-layouts or pages that need additional skip links.
 */
export function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="skip-link"
    >
      {children}
    </a>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REENTRY — Your Personal Reentry Navigator',
  description:
    'AI-powered reentry navigator that transforms your release date into a personalized action plan. ID replacement, benefits enrollment, housing, employment, and more.',
  keywords: [
    'reentry',
    'reentry navigator',
    'prison release',
    'returning citizen',
    'benefits',
    'employment',
    'housing',
    'action plan',
  ],
  openGraph: {
    title: 'REENTRY — Your Personal Reentry Navigator',
    description:
      'Breaking the 43% recidivism cycle. Get your personalized action plan in minutes.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#2577eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}

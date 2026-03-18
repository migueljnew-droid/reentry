const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@reentry/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

// Only wrap with Sentry if SENTRY_DSN is configured
if (process.env.SENTRY_DSN) {
  module.exports = withSentryConfig(nextConfig, {
    // Suppresses source map upload logs during build
    silent: true,
    // Upload source maps for better stack traces
    widenClientFileUpload: true,
    // Hide source maps from client bundles
    hideSourceMaps: true,
    // Disable Sentry telemetry
    disableLogger: true,
  });
} else {
  module.exports = nextConfig;
}

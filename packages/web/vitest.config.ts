import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/app/api/**/*.ts', 'src/app/actions/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.d.ts',
        'src/lib/voice.ts',
        'src/lib/whisper.ts',
        'src/lib/offline.ts',
        'src/lib/notifications.ts',
        'src/lib/api.ts',
        'src/lib/ai.ts',
        'src/lib/supabase.ts',
        'src/app/api/intake/voice/route.ts',
        'src/app/actions/generate-plan.ts',
        'src/app/actions/transcribe.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@reentry/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});

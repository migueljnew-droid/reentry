import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

interface ServiceStatus {
  supabase: boolean;
  openai: boolean;
}

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Determine overall health status from individual service checks.
 * - "healthy" = all services up
 * - "degraded" = 1+ optional services down (openai)
 * - "unhealthy" = critical service (supabase) is down
 */
function getOverallStatus(services: ServiceStatus): HealthStatus {
  if (!services.supabase) return 'unhealthy';
  if (!services.openai) return 'degraded';
  return 'healthy';
}

export async function GET() {
  const services: ServiceStatus = {
    supabase: false,
    openai: false,
  };

  // Check Supabase connectivity with a lightweight query
  const supabase = createServiceClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('audit_log').select('id').limit(1);
      services.supabase = !error;
    } catch {
      services.supabase = false;
    }
  } else {
    // No Supabase configured — treat as healthy for dev mode
    services.supabase = true;
  }

  // Check OpenAI availability (API key presence only — no real call)
  services.openai = Boolean(process.env.OPENAI_API_KEY);

  const status = getOverallStatus(services);

  return NextResponse.json(
    {
      status,
      service: 'reentry-web',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      services,
    },
    { status: status === 'unhealthy' ? 503 : 200 }
  );
}

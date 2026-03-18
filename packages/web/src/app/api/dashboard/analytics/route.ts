import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  await logAudit({
    action: 'read',
    resourceType: 'dashboard_analytics',
    request: req,
  });

  return NextResponse.json({
    totalClients: 4,
    activeClients: 3,
    averageProgress: 56,
    riskBreakdown: { low: 2, medium: 1, high: 1, critical: 0 },
    completionRate: 25,
    activeRiskFlags: 3,
  });
}

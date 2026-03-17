import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    totalClients: 4,
    activeClients: 3,
    averageProgress: 56,
    riskBreakdown: { low: 2, medium: 1, high: 1, critical: 0 },
    completionRate: 25,
    activeRiskFlags: 3,
  });
}

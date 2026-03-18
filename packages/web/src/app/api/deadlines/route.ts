import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  await logAudit({
    action: 'read',
    resourceType: 'deadlines',
    request: req,
  });

  return NextResponse.json({
    deadlines: [
      { id: randomUUID(), title: 'Parole check-in', dueDate: '2026-03-24T10:00:00Z', category: 'supervision', status: 'upcoming' },
      { id: randomUUID(), title: 'SNAP recertification', dueDate: '2026-04-15T23:59:00Z', category: 'benefits', status: 'upcoming' },
    ],
  });
}

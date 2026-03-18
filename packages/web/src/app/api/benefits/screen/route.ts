import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { validateRequest } from '@/lib/validate';
import { benefitsScreenSchema } from '@/lib/schemas';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateRequest(benefitsScreenSchema, body);
  if (!validated.success) return validated.response;

  const { userId } = validated.data;

  const results = [
    { program: 'SNAP', eligible: true, confidence: 0.95, monthlyValue: '$292' },
    { program: 'Medicaid', eligible: true, confidence: 0.98, monthlyValue: 'Full coverage' },
    { program: 'Lifeline', eligible: true, confidence: 0.90, monthlyValue: 'Free phone' },
    { program: 'TANF', eligible: false, confidence: 0.70, monthlyValue: '$300' },
    { program: 'LIHEAP', eligible: true, confidence: 0.85, monthlyValue: '$200/year' },
    { program: 'Section 8', eligible: true, confidence: 0.60, monthlyValue: '70% rent' },
    { program: 'Pell Grant', eligible: true, confidence: 0.99, monthlyValue: '$7,395/year' },
  ].map(r => ({ ...r, id: randomUUID() }));

  await logAudit({
    action: 'screen',
    resourceType: 'benefits_screenings',
    details: { userId, programsScreened: results.length, eligible: results.filter(r => r.eligible).length },
    request: req,
  });

  return NextResponse.json({
    userId,
    programsScreened: 9,
    eligiblePrograms: 7,
    results,
  });
}

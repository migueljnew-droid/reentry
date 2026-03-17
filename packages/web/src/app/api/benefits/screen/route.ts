import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  return NextResponse.json({
    userId,
    programsScreened: 9,
    eligiblePrograms: 7,
    results: [
      { program: 'SNAP', eligible: true, confidence: 0.95, monthlyValue: '$292' },
      { program: 'Medicaid', eligible: true, confidence: 0.98, monthlyValue: 'Full coverage' },
      { program: 'Lifeline', eligible: true, confidence: 0.90, monthlyValue: 'Free phone' },
      { program: 'TANF', eligible: false, confidence: 0.70, monthlyValue: '$300' },
      { program: 'LIHEAP', eligible: true, confidence: 0.85, monthlyValue: '$200/year' },
      { program: 'Section 8', eligible: true, confidence: 0.60, monthlyValue: '70% rent' },
      { program: 'Pell Grant', eligible: true, confidence: 0.99, monthlyValue: '$7,395/year' },
    ].map(r => ({ ...r, id: randomUUID() })),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { generateReentryPlan } from '@/app/actions/generate-plan';

export async function POST(req: NextRequest) {
  const intake = await req.json();
  const plan = await generateReentryPlan(intake);
  return NextResponse.json({ plan });
}

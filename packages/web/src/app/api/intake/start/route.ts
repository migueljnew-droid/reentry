import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST() {
  return NextResponse.json({
    sessionId: randomUUID(),
    reply: "Welcome to REENTRY. I'm here to build your personal reentry action plan. Let's start — what's your name?",
    stage: 'welcome',
  });
}

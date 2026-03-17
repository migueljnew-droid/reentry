import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { sessionId, message } = await req.json();
  return NextResponse.json({
    sessionId,
    reply: `Got it: "${message}". Processing...`,
    stage: 'processing',
  });
}

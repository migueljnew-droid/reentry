import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logAudit } from '@/lib/audit';
import { whisperCircuit, CircuitOpenError } from '@/lib/circuit-breaker';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audio = formData.get('audio') as File | null;

  if (!audio) {
    return NextResponse.json(
      { error: 'Missing required field: audio' },
      { status: 422 }
    );
  }

  if (!openai) {
    return NextResponse.json(
      { error: 'Voice transcription service not configured' },
      { status: 503 }
    );
  }

  let transcription: unknown;
  try {
    transcription = await whisperCircuit.execute(() =>
      openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: audio,
        language: 'en',
        response_format: 'text',
      })
    );
  } catch (error) {
    if (error instanceof CircuitOpenError) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable, please try again shortly' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'Voice transcription failed' },
      { status: 502 }
    );
  }

  await logAudit({
    action: 'transcribe',
    resourceType: 'voice_transcripts',
    // Never log transcript content — only that transcription occurred
    details: { audioSize: audio.size, language: 'en' },
    request: req,
  });

  return NextResponse.json({
    transcript: transcription as unknown as string,
    reply: 'Voice processed.',
    stage: 'processing',
  });
}

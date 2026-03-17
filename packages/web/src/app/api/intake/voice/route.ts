import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get('audio') as File | null;

  if (!audio || !openai) {
    return NextResponse.json({ transcript: '', error: 'Voice not available' }, { status: 400 });
  }

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file: audio,
    language: 'en',
    response_format: 'text',
  });

  return NextResponse.json({
    transcript: transcription as unknown as string,
    reply: 'Voice processed.',
    stage: 'processing',
  });
}

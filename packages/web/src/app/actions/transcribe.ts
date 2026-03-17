'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeVoice(formData: FormData): Promise<{ transcript: string; error?: string }> {
  try {
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return { transcript: '', error: 'No audio file provided' };
    }

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: 'en',
      response_format: 'text',
    });

    return { transcript: transcription as unknown as string };
  } catch (error) {
    console.error('Transcription failed:', error);
    return { transcript: '', error: 'Voice transcription failed. Please try typing instead.' };
  }
}

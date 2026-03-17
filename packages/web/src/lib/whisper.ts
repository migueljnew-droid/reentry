import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const file = new File([audioBlob], 'recording.webm', {
    type: audioBlob.type || 'audio/webm',
  });

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
    response_format: 'text',
  });

  return transcription as unknown as string;
}

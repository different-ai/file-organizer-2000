import { z } from 'zod';

export const transcriptionSchema = z.object({
  text: z.string(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionSchema>;

export const transcribeAudio = async (blob: Blob): Promise<TranscriptionResponse> => {
  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');
  formData.append('model', 'whisper-1');

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  const parsed = transcriptionSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error('Invalid transcription response');
  }

  return parsed.data;
};
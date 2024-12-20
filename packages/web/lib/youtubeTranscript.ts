import { YoutubeTranscript } from 'youtube-transcript';

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    // throw new Error('Failed to fetch YouTube transcript');
    return transcript.map(entry => entry.text).join(' ');
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw new Error('Failed to fetch YouTube transcript');
  }
}
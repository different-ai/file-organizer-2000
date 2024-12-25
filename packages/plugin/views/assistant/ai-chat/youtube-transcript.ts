import { requestUrl } from "obsidian";
import { logger } from "../../../services/logger";

export async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoPageResponse = await requestUrl(videoPageUrl);
    const videoPageBody = videoPageResponse.text;

    const captionsJson = videoPageBody.split('"captions":')[1]?.split(',"videoDetails')[0];
    if (!captionsJson) {
      throw new Error('Transcript not available');
    }

    logger.info("captionsJson", captionsJson);
    const captions = JSON.parse(captionsJson);
    const transcriptUrl = captions.playerCaptionsTracklistRenderer.captionTracks[0].baseUrl;

    const transcriptResponse = await requestUrl(transcriptUrl);
    const transcriptBody = transcriptResponse.text;
    logger.info("transcriptBody", transcriptBody);

    const transcript = transcriptBody.match(/<text[^>]*>(.*?)<\/text>/g)
      ?.map(line => line.replace(/<[^>]*>/g, ''))
      .join(' ');

    logger.info("transcript", transcript);


    return transcript || '';
  } catch (error) {
    logger.error('Error fetching YouTube transcript:', error);
    throw new Error('Failed to fetch YouTube transcript');
  }
}

export async function getYouTubeVideoTitle(videoId: string): Promise<string> {
  try {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const videoPageResponse = await requestUrl(videoPageUrl);
    const videoPageBody = videoPageResponse.text;

    const titleMatch = videoPageBody.match(/<title>(.+?)<\/title>/);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].replace(' - YouTube', '').trim();
    } else {
      return 'Untitled YouTube Video';
    }
  } catch (error) {
    logger.error('Error fetching YouTube video title:', error);
    return 'Untitled YouTube Video';
  }
}
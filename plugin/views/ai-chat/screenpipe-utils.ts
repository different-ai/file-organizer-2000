import { groupBy } from "lodash";
import { logMessage } from "../../../utils";

interface ScreenpipeQueryParams {
  startTime: string;
  endTime: string;
  contentType: "ocr" | "audio" | "all";
  query?: string;
  appName?: string;
  limit: number;
  offset?: number;
}

async function queryScreenpipe(params: ScreenpipeQueryParams) {
  try {
    const queryParams = new URLSearchParams({
      limit: params.limit.toString(),
      offset: (params.offset || 0).toString(),
      content_type: params.contentType,
      start_time: params.startTime,
      end_time: params.endTime,
    });

    if (params.query) queryParams.append('q', params.query);
    if (params.appName) queryParams.append('app_name', params.appName);

    const url = `http://localhost:3030/search?${queryParams}`;
    logMessage('Querying Screenpipe with URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    logMessage('Response status:', response.status);
    logMessage('Response headers:', response.headers);

    const responseText = await response.text();
    logMessage('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, message: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error("Error querying screenpipe:", error);
    throw error;
  }
}

export async function summarizeMeeting(duration: number = 60) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - duration * 60000);

  const result = await queryScreenpipe({
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    contentType: "audio",
    limit: 1000,
  });

  if (!result || !result.data || result.data.length === 0) {
    return { error: "No meeting data found for the specified duration." };
  }

  const transcripts = result.data.map(item => item.content.transcription).join(' ');
  
  // Perform more advanced analysis here, such as:
  // 1. Extracting key topics using NLP
  // 2. Identifying action items
  // 3. Summarizing main discussion points
  // 4. Detecting sentiment

  return {
    transcript: transcripts,
    duration: duration,
    wordCount: transcripts.split(/\s+/).length,
    // Add more advanced analysis results here
  };
}

export async function getDailyInformation(date: string = new Date().toISOString().split('T')[0]) {
  const startTime = new Date(date);
  startTime.setHours(0, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(23, 59, 59, 999);

  const [ocrResult, audioResult] = await Promise.all([
    queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      contentType: "ocr",
      limit: 1000,
    }),
    queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      contentType: "audio",
      limit: 1000,
    }),
  ]);

  if (!ocrResult || !audioResult) {
    return { error: "Failed to fetch daily information." };
  }

  const appUsage = groupBy(ocrResult.data, 'content.app_name');
  const productivityData = Object.entries(appUsage).map(([app, usage]) => ({
    app,
    interactions: usage.length,
    hours: usage.length / 60,
  })).sort((a, b) => b.hours - a.hours);

  const totalHours = productivityData.reduce((sum, app) => sum + app.hours, 0);

  const audioTranscripts = audioResult.data.map(item => item.content.transcription).join(' ');

  return {
    date,
    totalActiveHours: totalHours,
    topApps: productivityData.slice(0, 5),
    meetingsCount: audioResult.data.length,
    totalWordsSpoken: audioTranscripts.split(/\s+/).length,
    // Add more insights here, such as:
    // - Productivity score
    // - Task completion rate
    // - Focus time vs. distracted time
    // - Sentiment analysis of audio transcripts
  };
}
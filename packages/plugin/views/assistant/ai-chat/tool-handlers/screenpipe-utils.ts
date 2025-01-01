import { logger } from "../../../../services/logger";
import { logMessage } from "../../../../someUtils";
import FileOrganizer from "../../../..";

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

    if (params.query) queryParams.append("q", params.query);
    if (params.appName) queryParams.append("app_name", params.appName);

    const url = `http://localhost:3030/search?${queryParams}`;
    logger.info("Querying Screenpipe with URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    logMessage("Response status:", response.status);
    logMessage("Response headers:", response.headers);

    const responseText = await response.text();
    logMessage("Response body:", responseText);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${responseText}`
      );
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    logger.error("Error querying screenpipe:", error);
    throw error;
  }
}

function removeNonPrintable(text: string) {
  return text.replace(/[^\x20-\x7E]/g, '');
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function removeTimestamps(text: string) {
  return text.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '');
}

function removeURLsAndPaths(text: string) {
  return text.replace(/(https?:\/\/[^\s]+)/g, '');
}

function removeTechnicalTerms(text: string) {
  return text.replace(/[A-Z][A-Z0-9]+/g, '');
}

function removeUIWords(text: string) {
  const uiWords = [
    'click', 'tap', 'open', 'close', 'settings', 'create', 'cancel',
    // ... rest of UI words ...
  ];
  return uiWords.reduce((acc, word) => acc.replace(new RegExp(`\\b${word}\\b`, 'gi'), ''), text);
}

function removeShortWords(text: string) {
  return text.split(/\s+/).filter(word => word.length > 2).join(' ');
}

function removeRepeatedWords(text: string) {
  return text.split(/\s+/).filter((word, index, arr) => arr.indexOf(word) === index).join(' ');
}

function extractRelevantInfo(text: string, app: string) {
  // Implement relevant information extraction logic based on the app
  return text;
}


function preprocessText(text: string, app: string): string {
  // Basic cleaning
  text = removeNonPrintable(text);
  text = normalizeWhitespace(text);
  text = removeTimestamps(text);
  text = removeURLsAndPaths(text);
  text = removeTechnicalTerms(text);
  text = removeUIWords(text);
  text = removeShortWords(text);
  text = removeRepeatedWords(text);
  text = extractRelevantInfo(text, app);
  text = normalizeWhitespace(text);

  return text.length < 10 ? '' : text;
}

interface TimeframeParams {
  startTime?: string;
  endTime?: string;
  plugin: FileOrganizer;
}

export async function getDailyInformation({ 
  startTime: providedStartTime,
  endTime: providedEndTime,
  plugin 
}: TimeframeParams) {
  const endTime = providedEndTime ? new Date(providedEndTime) : new Date();
  const startTime = providedStartTime 
    ? new Date(providedStartTime)
    : new Date(endTime.getTime() - (plugin.settings.screenpipeTimeRange * 60 * 60 * 1000));

  const [ocrResult, audioResult] = await Promise.all([
    queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      contentType: "ocr",
      limit: plugin.settings.queryScreenpipeLimit,
      appName: "Arc"
    }),
    queryScreenpipe({
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      contentType: "audio",
      limit: plugin.settings.queryScreenpipeLimit,
    }),
  ]);

  if (!ocrResult?.data || !audioResult?.data) {
    return { error: "Failed to fetch daily information." };
  }

  const formatEntry = (entry: any): string => {
    const type = entry.type;
    const app = entry.content.app_name || 'Unknown';
    const text = entry.content.text || '';

    const cleanedText = preprocessText(text, app);
    
    if (!cleanedText) return '';
  
    return `[${type}][${app}] ${cleanedText}`;
  };

  const temp = [...ocrResult.data, ...audioResult.data]
    .map(formatEntry)
    .filter(Boolean)
    .join('\n');

  

  return temp;
}

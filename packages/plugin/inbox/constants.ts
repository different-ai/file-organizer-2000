export const VALID_MEDIA_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "bmp",
  "svg",
  "mp3",
  "wav",
  "mp4",
  "mov",
  "wmv",
];

export const CHUNK_SIZE = 1024 * 1024; // 1MB
export const MAX_CONCURRENT_TASKS = 100;
export const BATCH_DELAY = 100; // ms
export const MAX_BATCH_SIZE = 10;
export const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
export const MAX_LOG_SIZE = 100;
export const ERROR_FOLDER = "_FileOrganizer2000/Error";

export const NOTIFICATION_DURATIONS = {
  CRITICAL: 10000, // 10 seconds
  HIGH: 5000,      // 5 seconds
  MEDIUM: 3000,    // 3 seconds
  LOW: 2000,       // 2 seconds
};

export const FILE_PRIORITIES = {
  SMALL: 3,  // Small files (<100KB)
  MARKDOWN: 2, // Markdown files
  DEFAULT: 1, // Default priority
};

export const SIZE_THRESHOLDS = {
  SMALL: 1024 * 100, // 100KB
}; 
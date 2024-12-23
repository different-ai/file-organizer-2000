import { logger } from "./services/logger";

export function formatToSafeName(format: string) {
  return format.replace(/[\\/:"]/g, "");
}
export function cleanPath(path: string) {
  const trimmedPath = path.trim();
  // cleanup path remove leading and trailing slashes
  const pathWithoutLeadingAndTrailingSlashes = trimmedPath.replace(
    /^\/+|\/+$/g,
    ""
  );
  return pathWithoutLeadingAndTrailingSlashes;
}

export const logMessage = (...messages: any[]) => {
  logger.debug(...messages);
};

export const logError = (error: Error | string, details?: any) => {
  const message = error instanceof Error ? error.message : error;
  console.error(message);
  logger.error(message, details);
};

export function sanitizeTag(tag: string): string {
  // Remove any leading '#' symbols
  let sanitized = tag.replace(/^#+/, "");

  // Replace spaces and special characters with underscores, allowing Unicode word characters and forward slashes
  sanitized = sanitized.replace(/[^\p{L}\p{N}\-\/]+/gu, "_");

  // Remove any leading or trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, "");

  // Ensure the tag starts with a '#'
  return "#" + sanitized;
}

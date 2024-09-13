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
export const logMessage = (...args: any[]) => {
  if (process.env.NODE_ENV === "production") {
    return;
  }
  console.log(...args);
};

export function sanitizeTag(tag: string): string {
  // Remove any leading '#' symbols
  let sanitized = tag.replace(/^#+/, "");

  // Replace spaces and special characters with underscores
  sanitized = sanitized.replace(/[^\w\-]+/g, "_");

  // Remove any leading or trailing underscores
  sanitized = sanitized.replace(/^_+|_+$/g, "");

  // Ensure the tag starts with a '#'
  return "#" + sanitized;
}

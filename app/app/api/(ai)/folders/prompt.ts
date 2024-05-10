export function generatePrompt(
  model: string,
  content: string,
  fileName: string,
  folders: string[]
): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `Review the content: "${content}" and the file name: "${fileName}". Decide which of the following folders is the most suitable: ${folders.join(
        ", "
      )}. Base your decision on the relevance of the content and the file name to the folder themes. If no existing folder is suitable, suggest a new folder name that would appropriately categorize this file.`;
  }
}

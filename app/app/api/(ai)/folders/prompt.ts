export function generatePrompt(model: string, content: string, fileName: string, folders: string[]): string {
    switch (model) {
      case "gpt-4-turbo":
      default:
        return `Given the text content "${content}" (and if the file name "${fileName}"), which of the following folders would be the most appropriate location for the file? Available folders: ${folders.join(
          ", "
        )}, if none of the folders are appropriate, respond with "None". Only answer with folder path.`;
    }
  }
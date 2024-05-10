export function generatePrompt(model: string, content: string, fileName: string, templateNames: string[]): string {
    switch (model) {
      case "gpt-4-turbo":
      default:
        return `Given the text content "${content}" (and if relevant the file name "${fileName}"), which of the following document types best matches the content? ${templateNames.join(", ")}. Only respond with the best matching document type, nothing else.`;
    }
  }
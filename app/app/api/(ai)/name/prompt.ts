export function generatePrompt(model: string, document: string): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
Give a title to this document:
${document}`;
  }
}

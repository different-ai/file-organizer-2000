export function generatePrompt(model: string, document: string): string {
    switch (model) {
      case "gpt-4-turbo":
      default:
        return `Give a name to this document:
  ${document} should only be 30 chars long max. only answer with the name nothing else.`;
    }
  }
  
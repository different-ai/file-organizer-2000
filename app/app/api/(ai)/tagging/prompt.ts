export function generatePrompt(model: string, content: string, fileName: string, tags: string[]): string {
    switch (model) {
      case "gpt-4-turbo":
      default:
        return `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant?  
      Only answer tags and separate with commas. ${tags.join(", ")}`;
    }
  }
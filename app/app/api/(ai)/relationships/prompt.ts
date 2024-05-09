export function generatePrompt(model: string, activeFileContent: string, files: { name: string }[]): string {
    switch (model) {
      case "gpt-4-turbo":
      default:
        return `Given the content of the active file:
  
  ${activeFileContent}
  
  And the following files:
  
  ${files.map((file: { name: string }) => `File: ${file.name}\n`).join("\n\n")}
  
  Which 5 files are the most similar to the active file based on their content? Respond with a list of the 1-5 most similar file names, one per line. If none are similar, respond with "none".`;
    }
  }
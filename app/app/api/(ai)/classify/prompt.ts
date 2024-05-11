export function generatePrompt(
  model: string,
  content: string,
  fileName: string,
  templateNames: string[]
): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `Given the text content:
  
  "${content}"
  
  and if relevant, the file name:
  
  "${fileName}"
  
  Please identify which of the following document types best matches the content:
  
  Template Types:
  ${templateNames.join(", ")}
  
  If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string.`;
  }
}

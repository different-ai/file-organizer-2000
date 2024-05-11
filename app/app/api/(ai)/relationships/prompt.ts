export function generatePrompt(
  model: string,
  activeFileContent: string,
  files: { name: string }[]
): string {
  switch (model) {
    case "gpt-4-turbo":
    default:
      return `Analyze the content of the active file and compare it with the following files:

Active File Content:
${activeFileContent}

List of Files:
${files.map((file: { name: string }) => `File: ${file.name}`).join(", ")}

Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, return "none".`;
  }
}

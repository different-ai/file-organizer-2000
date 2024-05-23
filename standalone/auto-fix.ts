import { createOllamaInstance, configureTask } from "./models";
import { generateDocumentTitle, guessRelevantFolder } from "../src/aiService";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import fs from "fs";
import * as path from "path";

async function generateNewPrompt(
  previousPrompt: string,
  content: string,
  file: string,
  existingFolders: string[] = []
): Promise<string> {
  console.log("Generating new prompt...");
  configureTask("generate_prompt", "llama3");
  const response = await generateText({
    model: openai("gpt-4o"),
    prompt: `Please provide an improved prompt for the following task:
    
    Previous prompt: ${previousPrompt}
    
    Content: "${content}"
    File name: "${file}"
    Existing folders: ${existingFolders.join(", ")}`,
  });

  const newPrompt = response.text.trim();
  if (newPrompt !== previousPrompt) {
    fs.appendFileSync(
      "logs.txt",
      `File: ${file}\nPrevious Prompt: ${previousPrompt}\nNew Prompt: ${newPrompt}\n\n`
    );
  }

  return newPrompt;
}

async function processFiles(directoryPath: string): Promise<void> {
  console.log(`Processing files in directory: ${directoryPath}`);
  const files = fs.readdirSync(directoryPath);
  for (const file of files) {
    // if dstore ignore
    if (file === ".DS_Store") {
      continue;
    }
    const filePath = path.join(directoryPath, file);
    
    // Check if the path is a file before reading
    if (fs.statSync(filePath).isDirectory()) {
      console.log(`Skipping directory: ${file}`);
      continue;
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const existingFolders = fs
      .readdirSync(directoryPath)
      .filter((f) => fs.statSync(path.join(directoryPath, f)).isDirectory());

    try {
      console.log(`Processing file: ${file}`);
      let titlePrompt = `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
      
      Give a title to this document:
      
      ${content}`;

      const generatedTitle = await generateDocumentTitle(content);
      console.log(`Generated title: ${generatedTitle}`);
      console.log(`Title Prompt: ${titlePrompt}`);

      titlePrompt = await generateNewPrompt(titlePrompt, content, file);

      let folderPrompt = `Given the content: "${content}" and the file name: "${file}", suggest a new folder name that would appropriately categorize this file. Consider the existing folder structure: ${existingFolders.join(
        ", "
      )}.`;

      const suggestedFolder = await guessRelevantFolder(
        content,
        file,
        existingFolders
      );
      console.log(`Suggested folder: ${suggestedFolder}`);
      console.log(`Folder Prompt: ${folderPrompt}`);
      folderPrompt = await generateNewPrompt(
        folderPrompt,
        content,
        file,
        existingFolders
      );
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
}

async function main() {
  // Get the directory path from user input arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide the directory path as an argument.");
    process.exit(1);
  }

  const directoryPath = args[0];

  // Configure ollama instance
  createOllamaInstance("llama3", { baseURL: "http://localhost:11434/api" });

  // Configure tasks with the desired models
  configureTask("name", "llama3");
  configureTask("folders", "llama3");

  await processFiles(directoryPath);
}

main().catch((error) => {
  console.error("Error:", error);
});

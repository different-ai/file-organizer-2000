// import { getModel } from "./models";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import OpenAI from "openai";
import { getModelFromTask } from "./models";

// Function to generate tags
export async function generateTags(
  content: string,
  fileName: string,
  tags: string[]
): Promise<string[]> {
  const modelName = process.env.MODEL_TAGGING || "gpt-4o";
  const model = getModelFromTask("tagging");

  switch (modelName) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          tags: z.array(z.string()).default(["none"]),
        }),
        prompt: `Given the text "${content}" (and if relevant ${fileName}), identify the at most 3 relevant tags from the following list, sorted from most commonly found to least commonly found: ${tags.join(
          ", "
        )}`,
      });

      return response.object.tags;
    }
    case "codegemma": {
      const responseText = await generateText({
        model,
        prompt: `TASK -> Classify this content:
  CONTENT -> ${content}
  
  Select up to three tags from the list, plus one new tag:
  TAGS -> ${tags.join(", ")}
  
  Only respond with tags, then STOP.
  FORMAT -> tag1, tag2, tag3,`,
      });

      return responseText.text
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => content.includes(tag) === false);
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Given the text "${content}" (and if relevant ${fileName}), which of the following tags, sorted from most commonly found to least commonly found, are the most relevant?`,
        system: `you always answer a list of tags that exist separate them with commas. only answer tags nothing else\n\nOnly answer tags and separate with commas. ${tags.join(
          ", "
        )}`,
      });

      return defaultResponse.text
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tags.includes(tag));
    }
  }
}

// Function to generate folder suggestions
export async function generateFolderSuggestion(
  content: string,
  fileName: string,
  folders: string[]
): Promise<string> {
  const modelName = process.env.MODEL_FOLDERS || "gpt-4o";
  const model = getModelFromTask("folders");

  switch (modelName) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          suggestedFolder: z.string(),
        }),
        prompt: `Review the content: "${content}" and the file name: "${fileName}". Decide which of the following folders is the most suitable: ${folders.join(
          ", "
        )}. Base your decision on the relevance of the content and the file name to the folder themes. If no existing folder is suitable, suggest a new folder name that would appropriately categorize this file.`,
      });

      return response.object.suggestedFolder;
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Given the content: "${content}" and the file name: "${fileName}", identify the most suitable folder from the following options: ${folders.join(
          ", "
        )}. If none are suitable, suggest a new folder name.`,
        system: `you always answer a folder name\n\nOnly answer a folder name. If none of the existing folders are suitable, suggest a new folder name. nothing else no text before after`,
      });

      return defaultResponse.text.split("\n")[0].trim();
    }
  }
}

// Function to generate relationships between files
export async function generateRelationships(
  activeFileContent: string,
  files: { name: string }[]
): Promise<string[]> {
  const modelName = process.env.MODEL_RELATIONSHIPS || "gpt-4o";
  const model = getModelFromTask("relationships");

  switch (modelName) {
    case "gpt-4-turbo":
    case "gpt-4o":
      const response = await generateObject({
        model,
        schema: z.object({
          similarFiles: z.array(z.string()),
        }),
        prompt: `Analyze the content of the active file and compare it with the following files:

          Active File Content:
          ${activeFileContent}
          
          List of Files:
          ${files.map((file: { name: string }) => `${file.name}`).join(", ")}
          
          Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, return null.`,
      });

      return response.object.similarFiles || [];

    default:
      const defaultResponse = await generateText({
        model,
        prompt: `Analyze the content of the active file and compare it with the following files:

          Active File Content:
          ${activeFileContent}
          
          List of Files:
          ${files
            .map((file: { name: string }) => `File: ${file.name}`)
            .join(", ")}
          
          Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, return "none".`,
      });

      return defaultResponse.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "" && line !== "none");
  }
}

// Function to generate document titles
export async function generateDocumentTitle(document: string): Promise<string> {
  const modelName = process.env.MODEL_NAME || "gpt-4o";
  const model = getModelFromTask("name");

  switch (modelName) {
    case "gpt-4o":
      const response = await generateObject({
        model,
        schema: z.object({
          name: z.string().max(60),
        }),
        prompt: `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
          Give a title to this document:
          ${document}`,
      });

      return response.object.name;

    case "llama3":
      const responseText = await generateText({
        model,
        prompt: `Title Generator: Create a concise title for the following document, using only alphanumeric characters and spaces. The title must be exactly 30 characters long, including spaces. Do not include any special characters or punctuation.
              Document content:
              ${document}`,
        system: `Ensure the output is exactly 30 characters long, alphanumeric and spaces only, and directly answers as a title.`,
      });

      return responseText.text
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .slice(0, 30);

    default:
      const defaultResponse = await generateText({
        model,
        prompt: `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
          Give a title to this document:
          ${document}`,
      });

      return defaultResponse.text
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .slice(0, 30);
  }
}

// Function to transcribe audio
export async function transcribeAudio(
  audioBase64: string,
  extension: string
): Promise<string> {
  const modelName = process.env.MODEL_AUDIO || "whisper-1";
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const tempFilePath = join(tmpdir(), `upload_${Date.now()}.${extension}`);
  await fsPromises.writeFile(tempFilePath, audioBase64, { encoding: "base64" });

  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFilePath),
    model: modelName,
  });

  await fsPromises.unlink(tempFilePath);

  return transcription.text;
}

// Function to extract text from image
export async function extractTextFromImage(
  image: ArrayBuffer
): Promise<string> {
  const modelName = process.env.MODEL_VISION || "gpt-4o";
  const model = getModelFromTask("vision");

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract text from image. Write in markdown. If there's a drawing, describe it.",
        },
        {
          type: "image",
          image: image,
        },
      ],
    },
  ];

  const response = await generateText({
    model,
    messages,
  });

  return response.text.trim();
}

// Function to classify document type
export async function classifyDocument(
  content: string,
  fileName: string,
  templateNames: string[]
): Promise<string> {
  console.log("content", content);
  console.log("fileName", fileName);
  console.log("templateNames", templateNames);
  const modelName = process.env.MODEL_CLASSIFY || "gpt-4o";
  const model = getModelFromTask("classify");

  switch (modelName) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          documentType: z.string().optional(),
        }),
        prompt: `Given the text content:

          "${content}"
          
          and if relevant, the file name:
          
          "${fileName}"
          
          Please identify which of the following document types best matches the content:
          
          Template Types:
          ${templateNames.join(", ")}
          
          If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string.`,
      });

      return response.object.documentType || "";
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Given the text content:

          "${content}"
          
          and if relevant, the file name:
          
          "${fileName}"
          
          Please identify which of the following document types best matches the content:
          
          Template Types:
          ${templateNames.join(", ")}
          
          If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string.`,
      });

      return defaultResponse.text.trim();
    }
  }
}

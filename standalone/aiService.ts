// import { getModel } from "./models";
import { generateObject, generateText, streamObject } from "ai";
import { z } from "zod";
import fs from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { promises as fsPromises } from "fs";
import OpenAI from "openai";
import { getModelFromTask } from "./models";
import { logMessage } from "../utils";
// Function to generate tags
export async function generateTags(
  content: string,
  fileName: string,
  tags: string[]
): Promise<string[]> {
  const model = getModelFromTask("tagging");

  const modelName = model.modelId;

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

      return response.object.tags ?? [];
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Classify this content:
  CONTENT -> ${content}
  
  Select up to three tags from the list:
  TAGS -> ${tags.join(", ")}
  
  Only respond with tags, then STOP.
  FORMAT -> tag1, tag2, tag3`,
      });

      return defaultResponse.text
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tags.includes(tag));
    }
  }
}

// Function to generate alias variations
export async function generateAliasVariations(
  fileName: string,
  content: string
): Promise<string[]> {
  const model = getModelFromTask("name");

  switch (model.modelId) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          aliases: z.array(z.string()).default([]),
        }),
        prompt: `Generate a list of 3 closely related names (aliases) for the given file name: "${fileName}". The aliases should include variations in capitalization, spacing, and common extensions. For example, for "ECSS", generate aliases like "ecss", "ecss space", "ECSS", "ECSS Space", "ECSS Compliance", etc. Consider the context provided by the content "${content}".`,
        system: "only answer with name not extension",
      });

      return response.object.aliases ?? [];
    }
    default: {
      const defaultResponse = await generateText({
        model,
        system: "only answer with name not extension, no special characters, no numbers",
        prompt: `TASK -> Generate 3 closely related names (aliases) for the given file name.
  FILE NAME -> ${fileName}
  CONTENT -> ${content}
  
  The aliases should include variations in capitalization, spacing, and common extensions. For example, for "ECSS", generate aliases like "ecss", "ecss space", "ECSS", "ECSS Space", "ECSS Compliance", etc.
  
  Only answer with names, not extensions.
  FORMAT ->
  alias1
  alias2
  alias3`,
      });

      return defaultResponse.text.split("\n").map((alias) => alias.trim());
    }
  }
}

// Function to guess the relevant folder
export async function guessRelevantFolder(
  content: string,
  fileName: string,
  folders: string[]
): Promise<string | null> {
  const model = getModelFromTask("folders");
  console.log("modelazo", model.modelId);

  switch (model.modelId) {
    case "gpt-4o":
      const response = await generateObject({
        model,
        schema: z.object({
          suggestedFolder: z.string().nullable(),
        }),
        prompt: `Review the content: "${content}" and the file name: "${fileName}". Decide which of the following folders is the most suitable: ${folders.join(
          ", "
        )}. Base your decision on the relevance of the content and the file name to the folder themes. If no existing folder is suitable, respond with null.`,
      });
      console.log("default response", response);
      return response.object.suggestedFolder;
    default:
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Identify the most suitable folder for the given content and file name.
  CONTENT -> ${content} 
  FILE NAME -> ${fileName}
  
  FOLDERS -> ${folders.join(", ")}
  
  If none of the existing folders are suitable, respond with "null".
  FORMAT -> folder_name`,
      });
      logMessage("fileName", fileName);
      logMessage("defaultResponse", defaultResponse);
      return defaultResponse.text.trim() === "null"
        ? null
        : defaultResponse.text.trim();
  }
}

// Function to create a new folder if none is found
export async function createNewFolder(
  content: string,
  fileName: string,
  existingFolders: string[]
): Promise<string> {
  const model = getModelFromTask("folders");

  switch (model.modelId) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          newFolderName: z.string(),
        }),
        prompt: `Given the content: "${content}" and the file name: "${fileName}", suggest a new folder name that would appropriately categorize this file. Consider the existing folder structure: ${existingFolders.join(
          ", "
        )}.`,
      });

      return response.object.newFolderName;
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Suggest a new folder name to categorize the given content and file name.
        
  CONTENT -> ${content}
  FILE NAME -> ${fileName}
  
  EXISTING FOLDERS -> ${existingFolders.join(", ")}
  
  FORMAT -> new_folder_name`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to generate relationships between files
export async function generateRelationships(
  activeFileContent: string,
  files: { name: string }[]
): Promise<string[]> {
  const model = getModelFromTask("relationships");
  const modelName = model.modelId;

  switch (modelName) {
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
        prompt: `TASK -> Determine the five most similar files to the active file based on content.
        
  ACTIVE FILE CONTENT -> ${activeFileContent}
  
  FILES -> ${files.map((file: { name: string }) => file.name).join(", ")}
  
  Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, respond with "none".  
  FORMAT ->
  file1
  file2
  file3
  file4
  file5`,
      });

      return defaultResponse.text.trim() === "none"
        ? []
        : defaultResponse.text.split("\n").map((line) => line.trim());
  }
}

// Function to generate document titles
export async function generateDocumentTitle(document: string): Promise<string> {
  const model = getModelFromTask("name");
  const modelName = model.modelId;

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

    default:
      const defaultResponse = await generateText({
        model,
        system: "only answer with document title, no formatting, just letters",
        prompt: `TASK -> Generate a short title (less than 30 characters) for the given document.
        
  DOCUMENT -> ${document}
  
  Use plain text without special characters. The title should be specific to the content, not generic.
  `,
      });

      return defaultResponse.text.replace(/[^\w\s]/gi, '').trim().slice(0, 100);
  }
}

// Function to transcribe audio
export async function transcribeAudio(
  audioBase64: string,
  extension: string
): Promise<string> {
  throw new Error("This function is not implemented yet.");
  // Implementation remains the same as before
}

// Function to extract text from image
export async function extractTextFromImage(
  image: ArrayBuffer
): Promise<string> {
  const model = getModelFromTask("vision");
  const modelName = model.modelId;

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

  switch (modelName) {
    case "gpt-4o":
      const response = await generateText({
        model,
        //@ts-ignore
        messages,
      });

      return response.text.trim();

    default:
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Extract text from the provided image. Write in markdown format. If there's a drawing, describe it.
        
  IMAGE -> [Attached Image]`,
        //@ts-ignore
        messages,
      });

      return defaultResponse.text.trim();
  }
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
        prompt: `TASK -> Identify the document type that best matches the given content.
        
  CONTENT -> ${content}
  FILE NAME -> ${fileName}
  
  TEMPLATE TYPES -> ${templateNames.join(", ")}
  
  If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string.
  FORMAT -> document_type`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to format document content
export async function formatDocumentContent(
  content: string,
  formattingInstruction: string
): Promise<string> {
  const model = getModelFromTask("format");

  const modelName = model.modelId;
  switch (modelName) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          formattedContent: z.string(),
        }),
        prompt: `Format the following content according to the given instruction:
        
        Content:
        "${content}"
        
        Formatting Instruction:
        "${formattingInstruction}"`,
      });

      return response.object.formattedContent;
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Format the given content according to the provided instruction.
        
  CONTENT -> ${content}
  
  FORMATTING INSTRUCTION -> ${formattingInstruction}
  
  FORMAT -> formatted_content`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to identify concepts in the document
export async function identifyConcepts(content: string): Promise<string[]> {
  const model = getModelFromTask("format");

  switch (model.modelId) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          concepts: z.array(z.string()),
        }),
        prompt: `Split documents into the fewest atomic chunks possible. The goal is to identify the key concepts in the document.

      ${content}

      `,
      });

      return response.object.concepts;
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Identify the key concepts in the given document by splitting it into the fewest atomic chunks possible.
        
  DOCUMENT -> ${content}
  
  FORMAT ->
  concept1
  concept2
  concept3
  ...`,
      });

      return defaultResponse.text.split("\n").map((concept) => concept.trim());
    }
  }
}

// Function to fetch chunks for a given concept
export async function fetchChunksForConcept(
  content: string,
  concept: string
): Promise<{ content: string }> {
  const model = getModelFromTask("format");

  switch (model.modelId) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          content: z.string(),
        }),
        prompt: `Given the document content and the concept "${concept}", extract the relevant chunks of information:

      Document Content:
      ${content}

      Concept: ${concept}

      `,
      });

      return response.object;
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `TASK -> Extract the relevant chunks of information for the given concept from the document content.
        
  DOCUMENT CONTENT -> ${content}
  
  CONCEPT -> ${concept}
  
  FORMAT -> relevant_chunks`,
      });

      return { content: defaultResponse.text.trim() };
    }
  }
}

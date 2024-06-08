import { LanguageModel, generateObject, generateText, streamObject } from "ai";
import { z } from "zod";
import { makeApiRequest } from "../src/index";

// Function to generate tags
export async function generateTags(
  content: string,
  fileName: string,
  tags: string[],
  model: LanguageModel
): Promise<string[]> {
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
        prompt: `Given the text "${content}" (and if relevant ${fileName}), identify the at most 3 relevant tags from the following list, sorted from most commonly found to least commonly found: ${tags.join(
          ", "
        )}. Respond with only the tags, no other text.`,
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
  content: string,
  model: LanguageModel
): Promise<string[]> {
  switch (model.modelId) {
    case "gpt-4o": {
      const response = await generateObject({
        model,
        schema: z.object({
          aliases: z.array(z.string()).default([]),
        }),
        prompt: `Generate a list of 3 closely related names (aliases) for the given document name: "${fileName}". The aliases should include variations in capitalization.  Consider the context provided by the content "${content}".`,
        system:
          "only answer with good names that could refer to a title of this document",
      });

      return response.object.aliases ?? [];
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Generate a list of 3 closely related names (aliases) for the given document name: "${fileName}". The aliases should include variations in capitalization. Consider the context provided by the content "${content}". Respond with only the aliases, no other text.`,
      });

      return defaultResponse.text.split("\n").map((alias) => alias.trim());
    }
  }
}

// Function to guess the relevant folder
export async function guessRelevantFolder(
  content: string,
  fileName: string,
  folders: string[],
  model: LanguageModel
): Promise<string | null> {
  console.log("modelazo", model.modelId);

  switch (model.modelId) {
    case "gpt-4o":
      // eslint-disable-next-line no-case-declarations
      const response = await generateObject({
        model,
        schema: z.object({
          suggestedFolder: z.string().nullable(),
        }),
        prompt: `Review the content: "${content}" and the file name: "${fileName}". Decide which of the following folders is the most suitable: ${folders.join(
          ", "
        )}. Base your decision on the relevance of the content and the file name to the folder themes. If no existing folder is suitable, respond with null.`,
      });
      return response.object.suggestedFolder;
    default:
      // eslint-disable-next-line no-case-declarations
      const defaultResponse = await generateText({
        model,
        temperature: 0,
        system: "only answer with a pathname from the list",
        prompt: `    Given the content: "${content}" and the file name: "${fileName}",
        determine the most appropriate folder from the following list:
        "${folders.join(
          ", "
        )}". Based on the main topic and purpose of the content, return
        only the name of the most relevant folder from the list. If none of the
        existing folders are suitable, respond with 'null'. Your response must
        contain only the folder name.`,
      });
      return defaultResponse.text.trim() === "null"
        ? null
        : defaultResponse.text.trim();
  }
}

// Function to create a new folder if none is found
export async function createNewFolder(
  content: string,
  fileName: string,
  existingFolders: string[],
  model: LanguageModel
): Promise<string> {
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
        prompt: `Given the content: "${content}" and the file name: "${fileName}", suggest a new folder name that would appropriately categorize this file. Consider the existing folder structure: ${existingFolders.join(
          ", "
        )}. Respond with only the new folder name, no other text.`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to generate relationships between files
export async function generateRelationships(
  activeFileContent: string,
  files: { name: string }[],
  model: LanguageModel
): Promise<string[]> {
  const modelName = model.modelId;

  switch (modelName) {
    case "gpt-4o": {
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
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Analyze the content of the active file and compare it with the following files:

          Active File Content:
          ${activeFileContent}
          
          List of Files:
          ${files.map((file: { name: string }) => `${file.name}`).join(", ")}
          
          Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, respond with an empty string. Respond with only the file names or an empty string, no other text.`,
      });

      return defaultResponse.text.trim() === ""
        ? []
        : defaultResponse.text.split("\n").map((line) => line.trim());
    }
  }
}

// Function to generate document titles
export async function generateDocumentTitle(
  document: string,
  model: LanguageModel
): Promise<string> {
  const modelName = model.modelId;

  switch (modelName) {
    case "gpt-4o": {
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
    }
    default: {
      const defaultResponse = await generateText({
        model,
        prompt: `Give a title to this document: 
          ${document}
          Respond with a short title (less than 60 chars) using only filename characters (including spaces). Use something very specific to the content, not a generic title. Respond with only the title, no other text.`,
      });

      return defaultResponse.text
        .replace(/[^\w\s]/gi, "")
        .trim()
        .slice(0, 60);
    }
  }
}

// Function to transcribe audio
export async function transcribeAudio(
  encodedAudio: string,
  extension: string
): Promise<string> {
  try {
    const response = await makeApiRequest(() =>
      fetch(
        `${
          process.env.CUSTOM_SERVER_URL || process.env.DEFAULT_SERVER_URL
        }/api/audio`,
        {
          method: "POST",
          body: JSON.stringify({
            file: encodedAudio,
            extension: extension,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_KEY}`,
          },
        }
      )
    );
    const data = await response.json();
    return data.transcription;
  } catch (error) {
    console.error("Error generating transcript", error);
    throw error;
  }
}
// Function to extract text from image
export async function extractTextFromImage(
  image: ArrayBuffer,
  model: LanguageModel
): Promise<string> {
  const modelName = model.modelId;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Extract text from image. Write in markdown. If there's a drawing, describe it. Respond with only the extracted text or description, no other text.",
        },
        {
          type: "image",
          image: image,
        },
      ],
    },
  ];

  switch (modelName) {
    case "gpt-4o": {
      const response = await generateText({
        model,
        //@ts-ignore
        messages,
      });

      return response.text.trim();
    }
    default: {
      const defaultResponse = await generateText({
        model,
        //@ts-ignore
        messages,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to classify document type
export async function classifyDocument(
  content: string,
  fileName: string,
  templateNames: string[],
  model: LanguageModel
): Promise<string> {
  console.log("content", content);
  console.log("fileName", fileName);
  console.log("templateNames", templateNames);
  const modelName = model.modelId;

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
          
          If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string. Respond with only the document type or an empty string, no other text.`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to format document content
export async function formatDocumentContent(
  content: string,
  formattingInstruction: string,
  model: LanguageModel
): Promise<string> {
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
        prompt: `Format the following content according to the given instruction:
        
        Content:
        "${content}"
        
        Formatting Instruction:
        "${formattingInstruction}"
        
        Respond with only the formatted content, no other text.`,
      });

      return defaultResponse.text.trim();
    }
  }
}

// Function to identify concepts in the document
export async function identifyConcepts(
  content: string,
  model: LanguageModel
): Promise<string[]> {
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
        prompt: `Split the following document into the fewest atomic chunks possible. The goal is to identify the key concepts in the document. Respond with only the concepts, each on a new line, no other text.

      ${content}`,
      });

      return defaultResponse.text.split("\n").map((concept) => concept.trim());
    }
  }
}

// Function to fetch chunks for a given concept
export async function fetchChunksForConcept(
  content: string,
  concept: string,
  model: LanguageModel
): Promise<{ content?: string }> {
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
        prompt: `Given the document content and the concept "${concept}", extract the relevant chunks of information. Respond with only the extracted chunks, no other text.

      Document Content:
      ${content}

      Concept: ${concept}`,
      });

      return { content: defaultResponse.text.trim() };
    }
  }
}

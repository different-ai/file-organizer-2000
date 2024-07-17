// src/aiServiceRouter.ts
import { makeApiRequest } from "./index";
import {
  classifyDocument,
  generateTags,
  generateAliasVariations,
  guessRelevantFolder,
  generateRelationships,
  generateDocumentTitle,
  formatDocumentContent,
  identifyConcepts,
  fetchChunksForConcept,
  createNewFolder,
  extractTextFromImage,
  generateTranscriptFromAudio,
  identifyConceptsAndFetchChunks,
} from "../app/aiService";
import { requestUrl } from "obsidian";
import { getModelFromTask } from "../standalone/models";
import { arrayBufferToBase64 } from "obsidian";
import { logMessage } from "../utils";

export async function classifyDocumentRouter(
  content: string,
  name: string,
  templateNames: string[],
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string | undefined> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/classify1`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          fileName: name,
          templateNames,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { documentType } = await response.json;
    return documentType;
  } else {
    const model = getModelFromTask("classify");
    const response = await classifyDocument(
      content,
      name,
      templateNames,
      model
    );

    return response.object.documentType;
  }
}

export async function generateTagsRouter(
  content: string,
  fileName: string,
  tags: string[],
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string[]> {
  console.log("serverUrl tag", serverUrl);
  const response = await makeApiRequest(() =>
    requestUrl({
      url: `${serverUrl}/api/tags`,
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({
        content,
        fileName,
        tags,
      }),
      throw: false,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  );
  const { generatedTags } = await response.json;
  return generatedTags;
}
export async function createNewFolderRouter(
  content: string,
  fileName: string,
  existingFolders: string[],
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/create-folder`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          fileName,
          existingFolders,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { folderName } = await response.json;
    return folderName;
  } else {
    const model = getModelFromTask("folders");
    const response = await createNewFolder(
      content,
      fileName,
      existingFolders,
      model
    );
    return response.object.newFolderName;
  }
}

export async function generateAliasVariationsRouter(
  fileName: string,
  content: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string[]> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/aliases`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          fileName,
          content,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { aliases } = await response.json;
    return aliases;
  } else {
    const model = getModelFromTask("name");
    const response = await generateAliasVariations(fileName, content, model);
    return response.object.aliases ?? [];
  }
}

export async function guessRelevantFolderRouter(
  content: string,
  filePath: string,
  folders: string[],
  serverUrl: string,
  apiKey: string
): Promise<string | null> {
  const response = await makeApiRequest(() =>
    requestUrl({
      url: `${serverUrl}/api/folders`,
      method: "POST",
      contentType: "application/json",
      body: JSON.stringify({
        content,
        fileName: filePath,
        folders,
      }),
      throw: false,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  );
  const { folder: guessedFolder } = await response.json;
  return guessedFolder;
}

export async function generateRelationshipsRouter(
  activeFileContent: string,
  files: { name: string }[],
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string[]> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/relationships`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          activeFileContent,
          files,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { similarFiles } = await response.json;
    return similarFiles;
  } else {
    const model = getModelFromTask("relationships");
    const response = await generateRelationships(
      activeFileContent,
      files,
      model
    );
    return response.object.similarFiles;
  }
}

export async function generateDocumentTitleRouter(
  content: string,
  currentName: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string,
  renameInstructions: string
): Promise<string> {
  logMessage("renameInstructions", renameInstructions);
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/title`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          document: content,
          instructions: renameInstructions,
          currentName,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { title } = await response.json;
    return title;
  } else {
    const model = getModelFromTask("name");
    const response = await generateDocumentTitle(
      content,
      currentName,
      model,
      renameInstructions
    );
    return response.object.name;
  }
}

export async function formatDocumentContentRouter(
  content: string,
  formattingInstruction: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/format`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          content,
          formattingInstruction,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { content: formattedContent } = await response.json;
    return formattedContent;
  } else {
    const model = getModelFromTask("format");
    const response = await formatDocumentContent(
      content,
      formattingInstruction,
      model
    );
    return response.object.formattedContent;
  }
}

export async function identifyConceptsRouter(
  content: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string[]> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/concepts`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ content }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { concepts } = await response.json;
    return concepts;
  } else {
    const model = getModelFromTask("format");
    const response = await identifyConcepts(content, model);
    return response.object.concepts;
  }
}

export async function fetchChunksForConceptRouter(
  content: string,
  concept: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<{ content: string | undefined }> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/chunks`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ content, concept }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { content: chunkContent } = await response.json;
    return { content: chunkContent };
  } else {
    const model = getModelFromTask("chunks");
    const response = await fetchChunksForConcept(content, concept, model);
    return { content: response.object.content };
  }
}

export async function extractTextFromImageRouter(
  image: ArrayBuffer,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string> {
  if (usePro) {
    const base64Image = arrayBufferToBase64(image);

    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/vision`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ image: base64Image }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { text } = await response.json;
    return text;
  } else {
    const model = getModelFromTask("vision");
    console.log("image", image);
    return await extractTextFromImage(image, model);
  }
}

export async function identifyConceptsAndFetchChunksRouter(
  content: string,
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<{ name: string; chunk: string }[]> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/concepts-and-chunks`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ content }),
        throw: false,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { concepts } = await response.json;
    return concepts;
  } else {
    const model = getModelFromTask("format"); // You might want to create a specific task for this
    const response = await identifyConceptsAndFetchChunks(content, model);
    return response.object.concepts;
  }
}

export async function transcribeAudioRouter(
  encodedAudio: string,
  fileExtension: string,
  {
    usePro,
    serverUrl,
    fileOrganizerApiKey,
    openAIApiKey,
  }: {
    usePro: boolean;
    serverUrl: string;
    fileOrganizerApiKey: string;
    openAIApiKey: string;
  }
): Promise<string> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/transcribe`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({
          audio: encodedAudio,
          extension: fileExtension,
        }),
        throw: false,
        headers: {
          Authorization: `Bearer ${fileOrganizerApiKey}`,
        },
      })
    );
    const { text } = await response.json;
    return text;
  } else {
    const audioBuffer = Buffer.from(encodedAudio, "base64");
    const response = await generateTranscriptFromAudio(
      audioBuffer,
      fileExtension,
      openAIApiKey
    );
    return response;
  }
}

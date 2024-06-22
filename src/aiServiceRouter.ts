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
} from "../app/aiService";
import { requestUrl } from "obsidian";
import { getModelForTaskV2 } from "./models";
import { arrayBufferToBase64 } from "obsidian";

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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { documentType } = await response.json;
    return documentType;
  } else {
    const model = getModelForTaskV2("text");
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
  if (usePro) {
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { generatedTags } = await response.json;
    return generatedTags;
  } else {
    const model = getModelForTaskV2("text");
    const response = await generateTags(content, fileName, tags, model);
    return response.object.tags ?? [];
  }
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { folderName } = await response.json;
    return folderName;
  } else {
    const model = getModelForTaskV2("text");
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { aliases } = await response.json;
    return aliases;
  } else {
    const model = getModelForTaskV2("text");
    const response = await generateAliasVariations(fileName, content, model);
    return response.object.aliases ?? [];
  }
}

export async function guessRelevantFolderRouter(
  content: string,
  filePath: string,
  folders: string[],
  useServer: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string | null> {
  console.log("useServer", useServer);

  if (useServer) {
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { folder: guessedFolder } = await response.json;
    return guessedFolder;
  } else {
    const model = getModelForTaskV2("text");
    const response = await guessRelevantFolder(
      content,
      filePath,
      folders,
      model
    );
    return response.object.suggestedFolder;
  }
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
    const model = getModelForTaskV2("text");
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
  usePro: boolean,
  serverUrl: string,
  apiKey: string
): Promise<string> {
  if (usePro) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${serverUrl}/api/title`,
        method: "POST",
        contentType: "application/json",
        body: JSON.stringify({ document: content }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { title } = await response.json;
    return title;
  } else {
    const model = getModelForTaskV2("text");
    const response = await generateDocumentTitle(content, model);
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { content: formattedContent } = await response.json;
    return formattedContent;
  } else {
    const model = getModelForTaskV2("text");
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { concepts } = await response.json;
    return concepts;
  } else {
    const model = getModelForTaskV2("text");
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { content: chunkContent } = await response.json;
    return { content: chunkContent };
  } else {
    const model = getModelForTaskV2("text");
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
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
    );
    const { text } = await response.json;
    return text;
  } else {
    const model = getModelForTaskV2("vision");
    console.log("image", image);
    return await extractTextFromImage(image, model);
  }
}

export async function transcribeAudioRouter(
  encodedAudio: string,
  fileExtension: string,
  { usePro, serverUrl, fileOrganizerApiKey, openAIApiKey }: {
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
        headers: {
          Authorization: `Bearer ${fileOrganizerApiKey}`,
        },
      })
    );
    const { transcription } = await response.json;
    console.log({ transcription });
    return transcription;
  } else {
    const audioBuffer = Buffer.from(encodedAudio, "base64");
    const response = await generateTranscriptFromAudio(audioBuffer, openAIApiKey);
    return response;
  }
}

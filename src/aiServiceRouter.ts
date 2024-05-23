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
} from "./aiService";
import { requestUrl } from "obsidian";
import { getModelFromTask } from "../standalone/models";

export async function classifyDocumentRouter(
  content: string,
  name: string,
  templateNames: string[],
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<{ type: string; formattingInstruction: string } | null> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/classify1`,
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
    return { type: documentType, formattingInstruction: "" };
  } else {
    const model = getModelFromTask("classify");
    return await classifyDocument(content, name, templateNames, model);
  }
}

export async function generateTagsRouter(
  content: string,
  fileName: string,
  tags: string[],
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string[]> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/tags`,
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
    const { tags: generatedTags } = await response.json;
    return generatedTags;
  } else {
    const model = getModelFromTask("tagging");
    return await generateTags(content, fileName, tags, model);
  }
}

export async function generateAliasVariationsRouter(
  fileName: string,
  content: string,
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string[]> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/aliases`,
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
    const model = getModelFromTask("name");
    return await generateAliasVariations(fileName, content, model);
  }
}

export async function guessRelevantFolderRouter(
  content: string,
  filePath: string,
  folders: string[],
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string | null> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/folders`,
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
    const model = getModelFromTask("folders");
    return await guessRelevantFolder(content, filePath, folders, model);
  }
}

export async function generateRelationshipsRouter(
  activeFileContent: string,
  files: { name: string }[],
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string[]> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/relationships`,
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
    return await generateRelationships(activeFileContent, files, model);
  }
}

export async function generateDocumentTitleRouter(
  content: string,
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/title`,
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
    const model = getModelFromTask("name");
    return await generateDocumentTitle(content, model);
  }
}

export async function formatDocumentContentRouter(
  content: string,
  formattingInstruction: string,
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/format`,
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
    const model = getModelFromTask("format");
    return await formatDocumentContent(content, formattingInstruction, model);
  }
}

export async function identifyConceptsRouter(
  content: string,
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<string[]> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/concepts`,
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
    const model = getModelFromTask("format");
    return await identifyConcepts(content, model);
  }
}

export async function fetchChunksForConceptRouter(
  content: string,
  concept: string,
  useCustomServer: boolean,
  customServerUrl: string,
  apiKey: string
): Promise<{ content: string }> {
  if (useCustomServer) {
    const response = await makeApiRequest(() =>
      requestUrl({
        url: `${customServerUrl}/api/chunks`,
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
    const model = getModelFromTask("chunks");
    return await fetchChunksForConcept(content, concept, model);
  }
}

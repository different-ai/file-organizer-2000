import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider";
import { logMessage } from "../utils";
import { Notice } from "obsidian";

type Models = {
  [key: string]: LanguageModel;
};

export const models: Models = {};

export function createOpenAIInstance(
  apiKey: string,
  modelName = "gpt-4o",
  baseURL = "https://api.openai.com/v1"
) {
  console.log("initializing openai instance", modelName, apiKey, baseURL);
  const modelInstance = createOpenAI({ apiKey, baseURL })(modelName);
  return modelInstance;
}

export function createAnthropicInstance(apiKey: string, modelName: string) {
  const modelInstance = createAnthropic({ apiKey })(modelName);
  return modelInstance;
}

export function createOllamaInstance(
  modelName: string,
  { baseURL = "http://localhost:11434/api" }: { baseURL?: string }
) {
  const modelInstance = createOllama({ baseURL })(modelName);
  return modelInstance;
}

let taskModelConfigV2: Record<string, LanguageModel> = {};

// get model for task v2
export function configureTaskV2({
  task,
  provider,
  apiKey,
  modelName,
  baseUrl: baseURL,
}: {
  task: string;
  provider: "openai" | "ollama" | "anthropic";
  apiKey: string;
  modelName: string;
  baseUrl?: string;
}) {
  let model: LanguageModel;
  switch (provider) {
    case "openai":
      model = createOpenAIInstance(apiKey, modelName, baseURL);
      break;
    case "ollama":
      model = createOllamaInstance(modelName, {
        baseURL,
      });
      break;
    case "anthropic":
      model = createAnthropicInstance(apiKey, modelName);
      break;
    default:
      model = createOpenAIInstance(apiKey, modelName);
  }

  // use template strings
  logMessage(
    `Initialized model ${modelName} with provider ${provider} and api key ${apiKey}`
  );
  logMessage(model);
  taskModelConfigV2[task] = model;
  return models[modelName];
}

export function getModelForTaskV2(task: string) {
  const model = taskModelConfigV2[task];
  if (!model) {
    new Notice(`Task '${task}' is not configured.`, 3000);
    throw new Error(`Task '${task}' is not configured.`);
  }
  return model;
}

export function resetModels() {
  taskModelConfigV2 = {};
}

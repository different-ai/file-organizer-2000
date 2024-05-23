import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI, OpenAIProvider } from "@ai-sdk/openai";
import { LanguageModel } from "ai";
import { createOllama } from "ollama-ai-provider";

interface ModelConfig {
  [key: string]: any;
  defaultObjectGenerationMode: string;
  modelId: string;
}

type Models = {
  [key: string]: LanguageModel;
};

export const models: Models = {};

const taskModelConfig: Record<string, string> = {};

export function createOpenAIInstance(
  apiKey: string,
  modelName = "gpt-4o",
  baseURL = "https://api.openai.com/v1"
) {
  console.log("initializing openai instance", modelName, apiKey, baseURL);
  const modelInstance = createOpenAI({ apiKey, baseURL })(modelName);
  models[modelName] = modelInstance;
  return modelInstance;
}

export function createAnthropicInstance(apiKey: string, modelName: string) {
  const modelInstance = createAnthropic({ apiKey })(modelName);
  models[modelName] = modelInstance;
  return modelInstance;
}

export function createOllamaInstance(
  modelName: string,
  { baseURL = "http://localhost:11434/api" }: { baseURL: string }
) {
  const modelInstance = createOllama({ baseURL })(modelName);
  models[modelName] = modelInstance;
  return modelInstance;
}

export function configureTask(task: string, modelName: string) {
  console.log(`Configuring task '${task}' with model '${modelName}'`);
  if (!models[modelName]) {
    throw new Error(`Model '${modelName}' is not available.`);
  }
  taskModelConfig[task] = modelName;
}

export function getModelFromTask(task: string) {
  const modelName = taskModelConfig[task];
  if (!modelName) {
    throw new Error(`Task '${task}' is not configured.`);
  }
  const model = models[modelName];
  if (!model) {
    throw new Error(`Model '${modelName}' is not configured.`);
  }
  return model;
}

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from "ollama-ai-provider";

let models: Record<string, any> = {};
let taskModelConfig: Record<string, string> = {};

export function createOpenAIInstance(apiKey: string, modelName: string) {
  const modelInstance = createOpenAI({ apiKey })(modelName);
  models[modelName] = modelInstance;
  return modelInstance;
}

export function createAnthropicInstance(apiKey: string, modelName: string) {
  const modelInstance = createAnthropic({ apiKey })(modelName);
  models[modelName] = modelInstance;
  return modelInstance;
}

export function createOllamaInstance(modelName: string) {
  const modelInstance = createOllama({ baseURL: process.env.OLLAMA_API_URL })(
    modelName
  );
  models[modelName] = modelInstance;
  return modelInstance;
}



export function configureTask(task: string, modelName: string) {
  if (!models[modelName]) {
    throw new Error(`Model '${modelName}' is not available.`);
  }
  taskModelConfig[task] = modelName;
}

export function getModelFromTask(task: string) {
  console.log({ models });
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

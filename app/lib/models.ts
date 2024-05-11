import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider";

export const models = {
  "claude-3-haiku-20240307": anthropic("claude-3-haiku-20240307"),
  "claude-3-sonnet-20240229": anthropic("claude-3-sonnet-20240229"),
  "claude-3-opus-20240229": anthropic("claude-3-opus-20240229"),
  "gpt-3.5-turbo": openai("gpt-3.5-turbo"),
  "gpt-4-turbo": openai("gpt-4-turbo"),
  llama3: ollama("llama3"),
  "llama3-gradient": ollama("llama3-gradient"),
  "llava-llama3": ollama("llava-llama3"),
};

export function getModel(modelName: string) {
  const model = models[modelName];
  if (!model) {
    throw new Error(`Model '${modelName}' is not configured.`);
  }
  return model;
}

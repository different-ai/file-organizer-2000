import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";

export const models = {
  "claude-3-haiku-20240307": anthropic("claude-3-haiku-20240307"),
  "claude-3-sonnet-20240229": anthropic("claude-3-sonnet-20240229"),
  "claude-3-opus-20240229": anthropic("claude-3-opus-20240229"),
  "gpt-3.5-turbo": openai("gpt-3.5-turbo"),
  "gpt-4-turbo": openai("gpt-4-turbo"),
};

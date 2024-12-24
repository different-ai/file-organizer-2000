import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";

const DEFAULT_MODEL = "gpt-4o";

const models = {
  "gpt-4o": createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })("gpt-4o"),
  "gpt-4o-2024-08-06": createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })("gpt-4o-2024-08-06"),
  "gpt-4o-mini": createOpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })("gpt-4o-mini"),
  "claude-3-5-sonnet-20240620": createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })("claude-3-5-sonnet-20240620"),
  "claude-3-5-sonnet-20241022": createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })("claude-3-5-sonnet-20241022"),
  "claude-3-5-haiku-20241022": createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })("claude-3-5-haiku-20241022"),
  "gemini-2.0-flash-exp": createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY
  })("gemini-2.0-flash-exp"),
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    "claude-3-sonnet": createAmazonBedrock({
      region: process.env.AWS_REGION || "us-east-1",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    })("anthropic.claude-3-sonnet-20240229-v1:0"),
  } : {}),
};

export const getModel = (name: string) => {
  if (!models[name]) {
    console.log(`Model ${name} not found`);
    console.log(`Defaulting to ${DEFAULT_MODEL}`);
    return models[DEFAULT_MODEL];
  }
  console.log(`Using model ${name}`);

  return models[name];
};

export const getAvailableModels = () => {
  return Object.keys(models);
};

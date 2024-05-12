import { getModel, models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import { z } from "zod";

interface ModelResponse {
  name: string;
}

export function generateModelCall(
  document: string
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_NAME || "gpt-4-turbo";
  const model = getModel(modelName);

  switch (modelName) {
    case "gpt-4-turbo": {
      return async () => {
        const response = await generateObject({
          model,
          schema: z.object({
            name: z
              .string()
              .max(50)
              .regex(/^[a-zA-Z0-9\s]+$/),
          }),
          prompt: `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
          Give a title to this document:
          ${document}`,
        });

        return { name: response.object.name };
      };
    }
    case "llama3": {
      return async () => {
        const response = await generateText({
          model,
          prompt: `Title Generator: Create a concise title for the following document, using only alphanumeric characters and spaces. The title must be exactly 30 characters long, including spaces. Do not include any special characters or punctuation.
              Document content:
              ${document}`,
          system: `Ensure the output is exactly 30 characters long, alphanumeric and spaces only, and directly answers as a title.`,
        });

        const parsedResponse: ModelResponse = {
          name: response.text
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .slice(0, 30),
        };

        return parsedResponse;
      };
    }

    default: {
      return async () => {
        const response = await generateText({
          model,
          prompt: `You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.
          Give a title to this document:
          ${document}`,
        });

        const parsedResponse: ModelResponse = {
          name: response.text
            .trim()
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .slice(0, 30),
        };

        return parsedResponse;
      };
    }
  }
}

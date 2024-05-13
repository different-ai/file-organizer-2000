import { getModel, models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import { get } from "http";
import { z } from "zod";

interface ModelResponse {
  formattedText: string;
}

export function generateModelCall(
  content: string,
  formattingInstruction: string
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_TEXT || "gpt-4o";
  const model = getModel(modelName);
  console.log("text is using model", modelName);
  switch (modelName) {
    case "gpt-4o": {
      return async () => {
        const response = await generateObject({
          model,
          schema: z.object({
            formattedText: z.string(),
          }),
          prompt: `Format the following text according to these instructions:
          ${formattingInstruction}
          Text to format:
          ${content}
          Respond with only the formatted text.`,
          system: "assume markdown",
        });
        return { formattedText: response.object.formattedText };
      };
    }

    default: {
      return async () => {
        const response = await generateText({
          model,
          prompt: `Format the following text according to these instructions:
          ${formattingInstruction}
          Text to format:
          ${content}
          Respond with only the formatted text.`,
          system: "assume markdown",
        });

        const parsedResponse: ModelResponse = {
          formattedText: response.text.trim(),
        };

        return parsedResponse;
      };
    }
  }
}

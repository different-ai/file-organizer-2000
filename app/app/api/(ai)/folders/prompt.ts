import { models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import { z } from "zod";

interface ModelResponse {
  suggestedFolder: string;
}

export function generateModelCall(
  content: string,
  fileName: string,
  folders: string[]
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_FOLDERS || "gpt-4-turbo";
  const model = models[modelName];

  switch (modelName) {
    case "gpt-4-turbo": {
      return async () => {
        const response = await generateObject({
          model,
          schema: z.object({
            suggestedFolder: z.string(),
          }),
          prompt: `Review the content: "${content}" and the file name: "${fileName}". Decide which of the following folders is the most suitable: ${folders.join(
            ", "
          )}. Base your decision on the relevance of the content and the file name to the folder themes. If no existing folder is suitable, suggest a new folder name that would appropriately categorize this file.`,
        });

        return { suggestedFolder: response.object.suggestedFolder };
      };
    }

    default: {
      return async () => {
        const response = await generateText({
          model,
          prompt: `Given the content: "${content}" and the file name: "${fileName}", identify the most suitable folder from the following options: ${folders.join(
            ", "
          )}. If none are suitable, suggest a new folder name.`,
          system: `you always answer a folder name\n\nOnly answer a folder name. If none of the existing folders are suitable, suggest a new folder name. nothing else no text before after`,
        });

        const parsedResponse: ModelResponse = {
          suggestedFolder: response.text.split("\n")[0].trim(), // This will take only the first line of the response, assuming it's the folder name.
        };

        return parsedResponse;
      };
    }
  }
}

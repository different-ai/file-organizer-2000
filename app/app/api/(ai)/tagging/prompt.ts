import { models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import { z } from "zod";

interface ModelResponse {
  tags: string[];
}

export function generateModelCall(
  content: string,
  fileName: string,
  tags: string[]
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_TAGGING || "gpt-4-turbo";
  const model = models[modelName];

  switch (modelName) {
    case "gpt-4-turbo": {
      return async () => {
        const response = await generateObject({
          model,
          schema: z.object({
            tags: z.array(z.string()).max(3).default(["none"]),
          }),
          prompt: `Given the text "${content}" (and if relevant ${fileName}), identify the at most 3 relevant tags from the following list, sorted from most commonly found to least commonly found: ${tags.join(
            ", "
          )}`,
        });

        return { tags: response.object.tags };
      };
    }

    default: {
      return async () => {
        const response = await generateText({
          model,
          prompt: `Given the text "${content}" (and if relevant ${fileName}), which of the following tags, sorted from most commonly found to least commonly found, are the most relevant?`,
          system: `you always answer a list of tags that exist separate them with commas. only answer tags nothing else\n\nOnly answer tags and separate with commas. ${tags.join(
            ", "
          )}`,
        });

        const parsedResponse: ModelResponse = {
          tags: response.text
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tags.includes(tag)),
        };

        return parsedResponse;
      };
    }
  }
}

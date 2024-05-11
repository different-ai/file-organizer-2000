import { models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import z from "zod";

export function generateModelCall(
  content: string,
  fileName: string,
  tags: string[]
): any {
  const modelName = process.env.MODEL_TAGGING || "gpt-4-turbo";
  const model = models[modelName];
  switch (modelName) {
    case "gpt-4-turbo": {
      const prompt = `Given the text "${content}" (and if relevant ${fileName}), identify the at most 3 relevant tags from the following list, sorted from most commonly found to least commonly found: ${tags.join(
        ", "
      )}`;

      return () =>
        generateObject({
          model,
          schema: z.object({
            tags: z.array(z.string()).max(3).default(["none"]), // Default to ["none"] if no tags are identified
          }),
          prompt: prompt,
        });
    }
    default: {
      return () =>
        generateText({
          model,
          prompt: `Given the text "${content}" (and if relevant ${fileName}), which of the following tags, sorted from most commonly found to least commonly found, are the most relevant? `,
          system: `you always answer a list of tags that exist separate them with commas. only answer tags nothing else
        
        Only answer tags and separate with commas. ${tags.join(", ")}`,
        });
    }
  }
}

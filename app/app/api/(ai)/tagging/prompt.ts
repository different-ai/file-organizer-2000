import { models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import z from "zod";

export function generateModelCall(
  content: string,
  fileName: string,
  tags: string[]
): any {
  const modelName = process.env.MODEL_TAGGING || "gpt-4-turbo";
  console.log("tags", tags.join("\n "));
  console.log("using model", modelName, "for tagging");
  const model = models[modelName];
  switch (modelName) {
    case "gpt-4-turbo": {
      const prompt = `Given the text "${content}" (and if relevant ${fileName}), identify the at most 3 relevant tags from the following list: ${tags.join(
        ", "
      )}`;

      return () =>
        generateObject({
          model,
          schema: z.object({
            tags: z.array(z.string()).max(3),
          }),
          prompt: prompt,
          system:
            "Respond with up to 5 tags from the provided list. If a relevant tag is not in the list, return null.",
        });
    }
    default: {
      return () =>
        generateText({
          model,
          prompt: `Given the text "${content}" (and if relevant ${fileName}), which of the following tags are the most relevant? `,
          system: `you always answer a list of tags that exist separate them with commas. only answer tags nothing else
        
        Only answer tags and separate with commas. ${tags.join(", ")}`,
        });
    }
  }
}

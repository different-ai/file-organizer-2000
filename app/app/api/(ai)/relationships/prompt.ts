import { models } from "@/lib/models";
import { generateObject, generateText } from "ai";
import { z } from "zod";

interface ModelResponse {
  similarFiles: string[];
}

export function generateModelCall(
  activeFileContent: string,
  files: { name: string }[]
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_RELATIONSHIPS || "gpt-4-turbo";
  const model = models[modelName];

  switch (modelName) {
    case "gpt-4-turbo": {
      return async () => {
        const response = await generateObject({
          model,
          schema: z.object({
            similarFiles: z.array(z.string()).nullable(),
          }),
          prompt: `Analyze the content of the active file and compare it with the following files:

          Active File Content:
          ${activeFileContent}
          
          List of Files:
          ${files
            .map((file: { name: string }) => `${file.name}`)
            .join(", ")}
          
          Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, return null.`,
        });

        return { similarFiles: response.object.similarFiles || [] };
      };
    }

    default: {
      return async () => {
        const response = await generateText({
          model,
          prompt: `Analyze the content of the active file and compare it with the following files:

          Active File Content:
          ${activeFileContent}
          
          List of Files:
          ${files
            .map((file: { name: string }) => `File: ${file.name}`)
            .join(", ")}
          
          Determine which five files are most similar to the active file based on their content. Provide a ranked list of the top 5 similar file names, each on a new line. If no files are similar, return "none".`,
        });

        const parsedResponse: ModelResponse = {
          similarFiles: response.text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line !== "" && line !== "none"),
        };

        return parsedResponse;
      };
    }
  }
}

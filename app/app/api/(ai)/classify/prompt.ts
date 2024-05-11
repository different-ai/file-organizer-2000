import { models } from "@/lib/models";
import { generateText } from "ai";

interface ModelResponse {
  documentType: string;
}

export function generateModelCall(
  content: string,
  fileName: string,
  templateNames: string[]
): () => Promise<ModelResponse> {
  const modelName = process.env.MODEL_CLASSIFY || "gpt-4-turbo";
  const model = models[modelName];

  return async () => {
    const prompt = `Given the text content:

    "${content}"
    
    and if relevant, the file name:
    
    "${fileName}"
    
    Please identify which of the following document types best matches the content:
    
    Template Types:
    ${templateNames.join(", ")}
    
    If the content clearly matches one of the provided template types, respond with the name of that document type. If the content does not clearly match any of the template types, respond with an empty string.`;

    const response = await generateText({
      model,
      prompt: prompt,
    });

    const parsedResponse: ModelResponse = {
      documentType: response.text.trim(),
    };

    return parsedResponse;
  };
}
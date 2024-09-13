import { LanguageModel } from "ai";


type Models = {
  [key: string]: LanguageModel;
};

export const models: Models = {};

const taskModelConfig: Record<string, string> = {};





export function getModelFromTask(task: string) {
  const modelName = taskModelConfig[task];
  if (!modelName) {
    throw new Error(`Task '${task}' is not configured.`);
  }
  const model = models[modelName];
  if (!model) {
    throw new Error(`Model '${modelName}' is not configured.`);
  }
  return model;
}

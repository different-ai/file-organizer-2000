# Contributing new models

This README explains how to extend the prompts for existing models in File Organizer 2000 to customize the behavior of each endpoint.

## Steps to Extend Prompts

> If there's an existing model already available in lib/model.ts and there are issue with reliability this is a good place to start.


1. Identify the endpoint and model you want to modify:
   - Determine the endpoint to customize the prompt for (e.g., `/api/(ai)/tagging`).
   - Identify the model to extend the prompt for (e.g., `gpt-4-turbo`).

2. Open the corresponding prompt file:
   - Navigate to the prompt file for the desired endpoint (e.g., `app/api/(ai)/tagging/prompt.ts`).

3. Locate the `generatePrompt` function:
   - Find the `generatePrompt` function within the prompt file.

4. Modify the prompt template for the desired model:
   - Locate the `case` statement for the model you want to modify (e.g., `case "gpt-4-turbo"`).
   - Update the prompt template string to customize the model's behavior for that endpoint.

   ```typescript
   export function generatePrompt(model: string, content: string, fileName: string, tags: string[]): string {
     switch (model) {
       case "gpt-4-turbo":
         return `Given the text "${content}" (and if relevant ${fileName}), generate up to 5 relevant tags from the following list: ${tags.join(", ")}. Respond with only the tags, separated by commas.`;
       // ...existing cases
       default:
         return `Default prompt template for tagging: ${content}, ${fileName}, ${tags.join(", ")}`;
     }
   }
   ```

5. Save the changes to the prompt file.

By following these steps, you can easily extend the prompts for existing models in File Organizer 2000 to customize the behavior of each endpoint according to your specific requirements.

## Adding a New Model

If you want to add a new model to File Organizer 2000 from scratch, follow these additional steps:

1. Update `lib/models.ts`:
   - Import the desired model provider (e.g., `anthropic`, `openai`, or `ollama`).
   - Add a new entry to the `models` object with the model name as the key and the provider function as the value.

   ```typescript
   import { anthropic } from "@ai-sdk/anthropic";
   import { openai } from "@ai-sdk/openai";
   import { ollama } from "ollama-ai-provider";

   export const models = {
     // ...existing models
     "new-model": openai("new-model"),
   };
   ```

2. Update `.env` and `.env.example`:
   - Add the necessary environment variables for the new model provider (e.g., API key) to both files.

   `.env`:
   ```
   NEW_MODEL_API_KEY=your_api_key
   ```

   `.env.example`:
   ```
   NEW_MODEL_API_KEY=
   ```

3. Create a new `case` statement in the `generatePrompt` function:
   - Open the prompt file for the endpoint where you want to use the new model (e.g., `app/api/(ai)/tagging/prompt.ts`).
   - Add a new `case` statement for the new model.
   - Define the prompt template for the new model.

   ```typescript
   export function generatePrompt(model: string, content: string, fileName: string, tags: string[]): string {
     switch (model) {
       // ...existing cases
       case "new-model":
         return `New model prompt template for tagging: ${content}, ${fileName}, ${tags.join(", ")}`;
       default:
         return `Default prompt template for tagging: ${content}, ${fileName}, ${tags.join(", ")}`;
     }
   }
   ```

4. Set the corresponding `MODEL_xx` environment variable:
   - Open the `.env` file.
   - Set the value of the `MODEL_xx` environment variable to the name of the new model.

   ```
   MODEL_TAGGING=new-model
   ```

By following these additional steps, you can add a new model to File Organizer 2000 from scratch and customize its behavior by defining a new prompt template in the corresponding prompt file.

Remember to update the `.env.example` file with any new environment variables required for the new model provider, and keep your API keys secure by storing them in the `.env` file and not committing them to version control.

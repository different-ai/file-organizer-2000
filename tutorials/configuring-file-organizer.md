# Configuring File Organizer 2000 to Use Different Models

File Organizer 2000 supports using different AI models for various tasks such as tagging, folder suggestions, relationships, and more. 

- [Configure our `.env` to use the models you want](../app/.env.example)

## Available Models

File Organizer 2000 currently supports the following models:

- `claude-3-haiku-20240307` (Anthropic)
- `claude-3-sonnet-20240229` (Anthropic)
- `claude-3-opus-20240229` (Anthropic)
- `gpt-3.5-turbo` (OpenAI)
- `gpt-4-turbo` (OpenAI)
- `llama3` (Ollama) (points to localhost as ollama expects)
- `lava-llama3`
(see [model.ts](../app/lib/models.ts) for an up-to-date list)

## Configuring Models

To configure the models used by File Organizer 2000, you need to set the appropriate environment variables in your `.env` file. Here are the relevant environment variables:

- `MODEL_TAGGING`: Specifies the model to use for tagging files. Default is `gpt-4-turbo`.
- `MODEL_FOLDERS`: Specifies the model to use for suggesting folder locations. Default is `gpt-4-turbo`.
- `MODEL_RELATIONSHIPS`: Specifies the model to use for determining file relationships. Default is `gpt-4-turbo`.
- `MODEL_NAME`: Specifies the model to use for generating file names. Default is `gpt-4-turbo`.
- `MODEL_TEXT`: Specifies the model to use for text formatting tasks. Default is `gpt-4-turbo`.
- `MODEL_VISION`: Model to use for vision tasks. Default is `gpt-4-turbo`

(see [.env.example](../app/.env.example) for an up-to-date list)

To change the model for a specific task, simply update the corresponding environment variable with the desired model name from the available options.

For example, to use the `claude-3-opus-20240229` model for tagging files, set the following in your `.env` file:

```
MODEL_TAGGING=claude-3-opus-20240229
```

## Model Descriptions

Here's a brief description of each model:

- `claude-3-haiku-20240307`: An Anthropic model trained to generate haiku-style content.
- `claude-3-sonnet-20240229`: An Anthropic model trained to generate sonnet-style content.
- `claude-3-opus-20240229`: An Anthropic model trained to generate general-purpose content.
- `gpt-3.5-turbo`: OpenAI's GPT-3.5 model, which is a powerful language model capable of various tasks.
- `gpt-4-turbo`: OpenAI's GPT-4 model, which is an even more advanced language model with enhanced capabilities.
- `llama3`: Ollama's language model, which provides an alternative to OpenAI models.

Choose the model that best suits your needs based on the specific task and the desired output style.

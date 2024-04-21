import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};
type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const generateConfig = (
  document: string,
  model: string
): { url: string; messages?: Message[] } => {
  const config = {
    "gpt-3.5-turbo": {
      url: "https://api.openai.com/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.",
        },
        {
          role: "user",
          content: "Give a title to this document: \n " + document,
        },
      ],
    },
    // todo
    "dolphin-mistral": {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.",
        },
        {
          role: "user",
          content: "Give a title to this document: \n " + document,
        },
      ],
    },
    llama3: {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "assistant",
          content:
            "You are a helpful assistant. You only answer short (less than 30 chars titles). You do not use any special character just text. Use something very specific to the content not a generic title.",
        },
        {
          role: "user",
          content: "Give a title to this document: \n " + document,
        },
      ],
    },
  };
  return config[model];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    // Converting to boolean; returns true if USE_OLLAMA=true
    const useOllama = process.env.USE_OLLAMA === "true";
    const model = useOllama ? "dolphin-mistral" : "gpt-3.5-turbo";
    const config = useOllama
      ? generateConfig(req.body.document, model)
      : generateConfig(req.body.document, model);
    console.log("config", config);
    const data = {
      model,
      messages: [...config.messages],
    };

    const response = await fetch(config.url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (response.status === 401) {
      return res.status(401).json({ message: "Invalid API key" });
    }

    const result = await response.json();
    console.log("result name", result);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
}

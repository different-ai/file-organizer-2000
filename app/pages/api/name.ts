import { verifyKey } from "@unkey/api";
import type { NextApiRequest, NextApiResponse } from "next";
import PosthogClient from "../../lib/posthog";

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // if ENABLE_USER_MANAGEMENT=true in .env file, then we need to check for the Authorization header
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    console.log("ENABLE_USER_MANAGEMENT", process.env.ENABLE_USER_MANAGEMENT);

    const header = req.headers.authorization;
    console.log("header", header);
    if (!header) {
      return res.status(401).json({ message: "No Authorization header" });
    }
    const token = header.replace("Bearer ", "");
    const { result, error } = await verifyKey(token);

    const client = PosthogClient();

    if (client && result?.ownerId) {
      client.capture({
        distinctId: result?.ownerId,
        event: "call-api",
        properties: { endpoint: "name" },
      });
    }

    if (error) {
      console.error(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!result.valid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }


  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    // Converting to boolean; returns true if USE_OLLAMA=true
    const useOllama = process.env.USE_OLLAMA !== 'false'
    console.log("useOllama name", useOllama);
    const config = useOllama
      ? { model: "dolphin-mistral", url: "http://localhost:11434/v1/chat/completions" }
      : { model: "gpt-3.5-turbo", url: "https://api.openai.com/v1/chat/completions" };

    console.log("config", config);
    const data = {
      ...req.body,
      model: config.model,
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
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
}

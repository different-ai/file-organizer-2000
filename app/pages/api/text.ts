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
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {

    const header = req.headers.authorization;
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
        properties: { endpoint: "text" },
      });
    }


    if (error) {
      console.error(error.message);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!result.valid) {
      // do not grant access
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    // Converting to boolean; returns true if USE_OLLAMA=true
    const useOllama = process.env.USE_OLLAMA !== 'false'
    console.log("useOllama text", useOllama);
    console.log(typeof useOllama)
    const config = useOllama
      ? { model: "dolphin-mistral", url: "http://localhost:11434/v1/chat/completions" }
      : { model: "gpt-3.5-turbo", url: "https://api.openai.com/v1/chat/completions" };

    const data = {
      ...req.body,
      model: config.model,
    };


    console.log("text config", config);



    const response = await fetch(config.url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.log(`Error: ${response.status}`);
      return res.status(response.status).json({
        message: `Server responded with status: ${response.status}`,
      });
    }

    if (response.status === 401) {
      console.log("Invalid API key");
      return res.status(401).json({ message: "Invalid API key" });
    }
    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error" });
  }
}

import { verifyKey } from "@unkey/api";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // if ENABLE_USER_MANAGEMENT=true in .env file, then we need to check for the Authorization header
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    console.log("ENABLE_USER_MANAGEMENT", process.env.ENABLE_USER_MANAGEMENT)

    const header = req.headers.authorization;
    console.log("header", header);
    if (!header) {
      return res.status(401).json({ message: "No Authorization header" });
    }
    const token = header.replace("Bearer ", "");
    const { result, error } = await verifyKey(token);

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
    console.log("apiKey", apiKey)
    const model = "gpt-3.5-turbo";
    const data = {
      ...req.body,
      model,
    };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
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

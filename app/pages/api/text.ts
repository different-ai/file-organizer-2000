import { verifyKey } from "@unkey/api";
import type { NextApiRequest, NextApiResponse } from "next";

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

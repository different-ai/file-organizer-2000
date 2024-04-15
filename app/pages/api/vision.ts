import { verifyKey } from "@unkey/api";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

export const config = {
  // increase max size
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // if ENABLE_USER_MANAGEMENT=true in .env file, then we need to check for the Authorization header
  if (process.env.ENABLE_USER_MANAGEMENT == "true") {
    const header = req.headers.authorization;
    if (!header) {
      return new Response("No Authorization header", { status: 401 });
    }
    const token = header.replace("Bearer ", "");
    const { result, error } = await verifyKey(token);

    if (error) {
      console.error(error.message);
      return new Response("Internal Server Error", { status: 500 });
    }

    if (!result.valid) {
      // do not grant access
      return new Response("Unauthorized", { status: 401 });
    }
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    const payload = req.body;
    console.log("payload text route", payload);

    const model = "gpt-4-vision-preview";

    const data = {
      ...payload,
      model,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(data),
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

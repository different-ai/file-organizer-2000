const generateConfig = (document: string, folders: string[], model) => {
  const config = {
    "gpt-3.5-turbo": {
      url: "https://api.openai.com/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "Always answer with the name of the most appropriate folder from the provided list. If none of the folders are suitable, answer with 'None'.",
        },
        {
          role: "user",
          content: `Given the text "${document}", which of the following folders would be the most appropriate location for the file? Available folders: ${folders}`,
        },
      ],
    },
    "dolphin-mistral": {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "Always answer with the name of the most appropriate folder from the provided list. If none of the folders are suitable, answer with 'None'.",
        },
        {
          role: "user",
          content: `Given the text "${document}", which of the following folders would be the most appropriate location for the file? Available folders: ${folders}`,
        },
      ],
    },
    llama3: {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "Always answer with the name of the most appropriate folder from the provided list. If none of the folders are suitable, answer with 'None'.",
        },
        {
          role: "user",
          content: `Given the text "${document}", which of the following folders would be the most appropriate location for the file? Available folders: ${folders}`,
        },
      ],
    },
  };
  return config[model];
};

export async function POST(request: Request) {
  console.log("received post on folders route");
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    const useOllama = process.env.USE_OLLAMA === "true";
    const requestBody = await request.json();
    const model = useOllama ? "dolphin-mistral" : "gpt-3.5-turbo";

    const config = generateConfig(
      requestBody.document,
      requestBody.folders.join(", "),
      model
    );

    const data = {
      model,
      messages: [...config.messages],
    };

    console.log("folder data", data);
    const response = await fetch(config.url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (response.status === 401) {
      return new Response(JSON.stringify({ message: "Invalid API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await response.json();
    console.log("result from folders", result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

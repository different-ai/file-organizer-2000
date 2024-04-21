const generateConfig = (document: string, filePaths: string, model: string) => {
  console.log("generateConfig", filePaths);
  const config = {
    "gpt-3.5-turbo": {
      url: "https://api.openai.com/v1/chat/completions",
      messages: [
        {
          role: "system",
          content:
            "Always answer with the full path of the most appropriate file from the provided list. If none of the files are suitable, answer with 'None'.",
        },
        {
          role: "user",
          content: `Given the document: "${document}", which of the following files best matches the user's request? Available files: ${filePaths}`,
        },
      ],
    },
    "dolphin-mistral": {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "assistant",
          content: `Always answer full filename. Example Answer: "folder/subfolder/file.md"`,
        },
        {
          role: "user",
          content: `
          document: "${document}",
          files: "${filePaths}",
          
          identify the most relevant file. If none are suitable, respond with 'None'.`,
        },
      ],
    },
    llama3: {
      url: "http://localhost:11434/v1/chat/completions",
      messages: [
        {
          role: "user",
          content: `Based on the document: "${document}", identify the most relevant file. If none are suitable, respond with 'None'.`,
        },
      ],
    },
  };
  return config[model];
};

export async function POST(request: Request) {
  console.log("received post on files route");
  try {
    const apiKey = process.env.OPENAI_API_KEY || "";
    const useOllama = process.env.USE_OLLAMA === "true";
    const requestBody = await request.json();
    const model = useOllama ? "dolphin-mistral" : "gpt-3.5-turbo";

    const config = generateConfig(
      requestBody.document,
      requestBody.filePaths.join(", "),
      model
    );

    const data = {
      model,
      messages: [...config.messages],
    };

    console.log("file data", data);
    const response = await fetch(config.url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const result = await response.json();
    console.log("magic", result.choices[0].message.content);
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

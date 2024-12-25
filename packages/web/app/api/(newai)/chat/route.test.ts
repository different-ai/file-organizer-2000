import { NextRequest } from "next/server";
import { POST } from "./route";

describe("Chat API Route", () => {
  it("should include search grounding metadata in response", async () => {
    const mockRequest = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What's the latest news about AI?" }],
        model: "gemini-1.5-pro",
        enableSearchGrounding: true
      })
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);

    // Read the stream and check for metadata
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    let foundMetadata = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(5));
          if (data.type === "metadata" && data.data?.groundingMetadata) {
            foundMetadata = true;
            break;
          }
        }
      }
    }

    expect(foundMetadata).toBe(true);
  });
});

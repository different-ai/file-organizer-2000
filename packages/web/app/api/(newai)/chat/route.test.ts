import { NextRequest } from "next/server";
import { POST } from "./route";
// Mock the Google AI SDK
jest.mock("@ai-sdk/google", () => ({
  google: jest.fn(() => ({
    generateText: jest.fn().mockImplementation(async () => ({
      text: "Test response",
      experimental_providerMetadata: {
        google: {
          groundingMetadata: {
            webSearchQueries: ["test query"],
            searchEntryPoint: { renderedContent: "Test content" },
            groundingSupports: [{
              segment: { text: "Test segment", startIndex: 0, endIndex: 11 },
              groundingChunkIndices: [0],
              confidenceScores: [0.95]
            }]
          }
        }
      }
    }))
  }))
}));

describe("Chat API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should include search grounding metadata in response", async () => {
    const mockRequest = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "What's the latest news about AI?" }],
        model: "gemini-1.5-pro",
        enableSearchGrounding: true
      }),
      headers: {
        'x-user-id': 'test-user'
      }
    });

    const response = await POST(mockRequest);
    expect(response instanceof Response).toBe(true);
    
    // Read the stream and check for metadata
    const reader = (response as Response).body?.getReader();
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

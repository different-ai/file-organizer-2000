export const google = jest.fn((model: string, options: any) => ({
  generateText: jest.fn().mockImplementation(async ({ prompt }) => ({
    text: "Mocked response",
    experimental_providerMetadata: {
      google: {
        groundingMetadata: {
          webSearchQueries: ["test query"],
          searchEntryPoint: {
            renderedContent: "Test content"
          },
          groundingSupports: [{
            segment: {
              text: "Test segment",
              startIndex: 0,
              endIndex: 11
            },
            groundingChunkIndices: [0],
            confidenceScores: [0.95]
          }]
        }
      }
    }
  }))
}));

export type GoogleGenerativeAIProviderMetadata = {
  groundingMetadata?: {
    webSearchQueries: string[];
    searchEntryPoint: {
      renderedContent: string;
    };
    groundingSupports: Array<{
      segment: {
        text: string;
        startIndex: number;
        endIndex: number;
      };
      groundingChunkIndices: number[];
      confidenceScores: number[];
    }>;
  };
};

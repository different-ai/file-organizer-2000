export interface GroundingMetadata {
  webSearchQueries?: string[];
  searchEntryPoint?: {
    renderedContent: string;
  };
  groundingSupports?: Array<{
    segment: {
      text: string;
      startIndex: number;
      endIndex: number;
    };
    groundingChunkIndices: number[];
    confidenceScores: number[];
  }>;
}

export interface DataChunk {
  type: 'metadata';
  data: {
    groundingMetadata: GroundingMetadata;
  };
}

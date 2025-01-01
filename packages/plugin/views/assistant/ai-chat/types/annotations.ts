import type { Message } from 'ai';

export interface SearchResult {
  segment: {
    text: string;
    startIndex: number;
    endIndex: number;
  };
  groundingChunkIndices: number[];
  confidenceScores: number[];
}

export interface WebSource {
  web: {
    uri: string;
    title: string;
  };
}

export interface SearchResultsAnnotation {
  type: 'search-results';
  groundingMetadata: {
    webSearchQueries: string[];
    searchEntryPoint: {
      renderedContent: string;
    };
    groundingChunks: WebSource[];
    groundingSupports: SearchResult[];
  };
}

export type CustomAnnotation = SearchResultsAnnotation;

export function isSearchResultsAnnotation(
  annotation: any
): annotation is SearchResultsAnnotation {
  return annotation.type === 'search-results';
} 
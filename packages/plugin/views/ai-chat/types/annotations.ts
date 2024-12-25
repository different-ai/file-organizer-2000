import { MessageAnnotation } from 'ai';

export interface SearchResult {
  content: string;
  score: number;
  filePath: string;
}

export interface SearchResultsAnnotation extends MessageAnnotation {
  type: 'search-results';
  results: SearchResult[];
}

export type CustomAnnotation = SearchResultsAnnotation;

export function isSearchResultsAnnotation(
  annotation: MessageAnnotation
): annotation is SearchResultsAnnotation {
  return annotation.type === 'search-results';
} 
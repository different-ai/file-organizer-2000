declare module "@screenpipe/js" {
  export interface TranscriptionData {
    transcription: string;
    timestamp?: string;
    confidence?: number;
  }

  export interface ContentItem {
    type: string;
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }

  export interface VisionEvent {
    app_name?: string;
    window_name?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
  }

  export const pipe: {
    streamVision: (options: {
      onEvent: (event: VisionEvent) => void;
      onError?: (error: { message: string; code?: string }) => void;
    }) => void;
    streamTranscriptions: (options: {
      onData: (data: TranscriptionData) => void;
      onError?: (error: { message: string; code?: string }) => void;
    }) => void;
    settings: {
      getNamespaceSettings: (namespace: string) => Promise<Record<string, any> | null>;
    };
    queryScreenpipe: (options: {
      startTime: string;
      endTime: string;
      limit?: number;
      contentType?: string;
    }) => Promise<{ data: ContentItem[] }>;
  };
}

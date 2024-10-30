export interface WavRecorderOptions {
  sampleRate: number;
}

export class WavRecorder {
  constructor(options: WavRecorderOptions);
  begin(): Promise<void>;
  record(callback: (data: { mono: Float32Array }) => void): Promise<void>;
  pause(): Promise<void>;
  end(): Promise<void>;
  getFrequencies(type: string): { values: Float32Array };
  static decode(audio: any, sampleRate1: number, sampleRate2: number): Promise<{ url: string }>;
}

export interface WavStreamPlayerOptions {
  sampleRate: number;
}

export class WavStreamPlayer {
  constructor(options: WavStreamPlayerOptions);
  connect(): Promise<void>;
  interrupt(): Promise<{ trackId: string; offset: number } | null>;
  add16BitPCM(audio: any, id: string): void;
  getFrequencies(type: string): { values: Float32Array };
  analyser?: any;
}
export interface SearchParams {
  location: string;
  interest: string;
  timeframe: string;
  useCurrentLocation: boolean;
  latitude?: number;
  longitude?: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets?: {
            content: string;
        }[]
    }
  };
}

export interface DiscoveryResult {
  text: string;
  groundingChunks?: GroundingChunk[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

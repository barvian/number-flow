export interface TweetVideo {
  aspectRatio: [number, number];
  contentType: string;
  durationMs: number;
  mediaAvailability: {
    status: string;
  };
  poster: string;
  variants: {
    type: string;
    src: string;
  }[];
  videoId: {
    type: string;
    id: string;
  };
  viewCount: number;
}

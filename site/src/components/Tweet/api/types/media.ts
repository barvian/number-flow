import type { Indices } from "./entities.js";

export type RGB = {
  red: number;
  green: number;
  blue: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Size = {
  h: number;
  w: number;
  resize: string;
};

export interface VideoInfo {
  aspect_ratio: [number, number];
  variants: {
    bitrate?: number;
    content_type: "video/mp4" | "application/x-mpegURL";
    url: string;
  }[];
}

interface MediaBase {
  display_url: string;
  expanded_url: string;
  ext_media_availability: {
    status: string;
  };
  ext_media_color: {
    palette: {
      percentage: number;
      rgb: RGB;
    }[];
  };
  indices: Indices;
  media_url_https: string;
  original_info: {
    height: number;
    width: number;
    focus_rects: Rect[];
  };
  sizes: {
    large: Size;
    medium: Size;
    small: Size;
    thumb: Size;
  };
  url: string;
}

export interface MediaPhoto extends MediaBase {
  type: "photo";
  ext_alt_text?: string;
}

export interface MediaAnimatedGif extends MediaBase {
  type: "animated_gif";
  video_info: VideoInfo;
}

export interface MediaVideo extends MediaBase {
  type: "video";
  video_info: VideoInfo;
}

export type MediaDetails = MediaPhoto | MediaAnimatedGif | MediaVideo;

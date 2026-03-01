export interface Video {
  id: string
  youtubeId: string
  title: string
  channelName: string
  channelId: string
  description?: string
  publishedAt: string
  viewCount: number
  likeCount: number
  duration: number // seconds
  categoryId: string
  thumbnailUrl: string
  createdAt: string
}

export interface Frame {
  id: string
  videoId: string
  frameNumber: number // 1-6 for daily_frame
  timestampMs: number
  r2Key: string
  url?: string // presigned URL, populated at runtime
}

export interface ApiError {
  code: string
  message: string
}

export interface ApiMeta {
  timestamp: string
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  meta: ApiMeta
}

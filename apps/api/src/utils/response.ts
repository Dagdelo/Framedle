import type { ApiResponse } from '@framedle/shared'

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return {
    data,
    error: null,
    meta: { timestamp: new Date().toISOString() },
  }
}

export function apiError(code: string, message: string): ApiResponse<never> {
  return {
    data: null,
    error: { code, message },
    meta: { timestamp: new Date().toISOString() },
  }
}

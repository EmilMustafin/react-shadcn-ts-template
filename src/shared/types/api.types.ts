/**
 * Base API types and interfaces
 */

export interface IApiError {
  message: string
  code?: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export interface IPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface IApiResponse<T> {
  data: T
  message?: string
}

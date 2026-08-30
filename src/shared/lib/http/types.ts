import type { HTTPError } from "ky"

export interface IRefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface IHttpClientConfig {
  baseUrl: string
  timeout?: number
}

export type { HTTPError }

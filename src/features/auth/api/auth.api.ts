import ky from "ky"

import type { ILoginCredentials, IRegisterCredentials, IAuthTokens } from "../model/types"

import { env } from "@/shared/config"
import { tokenStorage } from "@/shared/lib"

export const authApi = {
  login: async (credentials: ILoginCredentials): Promise<IAuthTokens> => {
    return ky
      .post(`${env.VITE_API_URL}/api/auth/login`, {
        json: credentials,
      })
      .json<IAuthTokens>()
  },

  register: async (credentials: IRegisterCredentials): Promise<IAuthTokens> => {
    return ky
      .post(`${env.VITE_API_URL}/api/auth/register`, {
        json: credentials,
      })
      .json<IAuthTokens>()
  },

  refresh: async (): Promise<IAuthTokens> => {
    const refreshToken = tokenStorage.getRefreshToken()

    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    return ky
      .post(`${env.VITE_API_URL}/api/auth/refresh`, {
        json: { refreshToken },
      })
      .json<IAuthTokens>()
  },

  logout: async (): Promise<void> => {
    const refreshToken = tokenStorage.getRefreshToken()

    if (refreshToken) {
      try {
        await ky.post(`${env.VITE_API_URL}/api/auth/logout`, {
          json: { refreshToken },
        })
      } catch (error) {
        console.warn("Logout request failed:", error)
      }
    }
  },
}

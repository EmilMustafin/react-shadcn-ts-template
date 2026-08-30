/**
 * @security WARNING: localStorage is vulnerable to XSS attacks T_T
 * (will be better use backend with httpOnly cookies)
 */

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const ACCESS_TOKEN_EXPIRES_KEY = "access_token_expires_at"
const TOKEN_SKEW_MS = 60000 // 1m

type TListener = () => void
const listeners = new Set<TListener>()

const notifyListeners = () => {
  listeners.forEach((listener) => listener())
}

export const tokenStorage = {
  subscribe(listener: TListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },

  getSnapshot(): boolean {
    return Boolean(
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
    )
  },

  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(ACCESS_TOKEN_EXPIRES_KEY, expiresAt.toString())
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    notifyListeners()
  },

  getAccessToken(): string | null {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    const expiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_KEY)

    if (!token || !expiresAt) {
      return null
    }

    if (this.isAccessTokenExpired()) {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY)
      return null
    }
    return token
  },

  getRefreshToken(): string | null {
    const token = localStorage.getItem(REFRESH_TOKEN_KEY)
    return token
  },

  isAccessTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(ACCESS_TOKEN_EXPIRES_KEY)
    if (!expiresAt) return true
    return Date.now() >= parseInt(expiresAt) - TOKEN_SKEW_MS
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(ACCESS_TOKEN_EXPIRES_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    notifyListeners()
  },

  hasTokens(): boolean {
    return Boolean(this.getAccessToken() || this.getRefreshToken())
  },
}

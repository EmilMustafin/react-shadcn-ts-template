export interface ILoginCredentials {
  email: string
  password: string
}

export interface IRegisterCredentials extends ILoginCredentials {
  name: string
}

export interface IAuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface IAuthState {
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * Application route paths
 */
export const paths = {
  home: "/",
  login: "/login",
  register: "/register",
} as const

export type TAppPath = (typeof paths)[keyof typeof paths]

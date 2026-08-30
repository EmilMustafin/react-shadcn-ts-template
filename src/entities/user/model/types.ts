import type { UserRole } from "./constants"

export type TUserRole = (typeof UserRole)[keyof typeof UserRole]

export interface IUser {
  id: string
  email: string
  name: string
  role: TUserRole
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface IUserProfile extends IUser {
  bio?: string
  phone?: string
}

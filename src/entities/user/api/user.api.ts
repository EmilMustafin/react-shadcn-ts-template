import type { IUser } from "../model/types"

import { httpClient } from "@/shared/lib"

export const userApi = {
  getMe: async (): Promise<IUser> => {
    return httpClient.get("users/me").json<IUser>()
  },
}

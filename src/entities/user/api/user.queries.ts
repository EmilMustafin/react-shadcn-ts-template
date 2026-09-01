import { queryOptions } from "@tanstack/react-query"

import { userApi } from "./user.api"

import { USER_ENTITY, USER_QUERY_KEYS } from "@/entities/user/model/constants"
import { createQueryKeyFactory } from "@/shared/lib/react-query"

export const userKeys = createQueryKeyFactory(USER_ENTITY, (all) => ({
  me: () => [...all(), USER_QUERY_KEYS.ME] as const,
}))

export const userQueries = {
  me: () =>
    queryOptions({
      queryKey: userKeys.me(),
      queryFn: () => userApi.getMe(),
    }),
}

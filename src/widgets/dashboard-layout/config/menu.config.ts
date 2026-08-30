import { House } from "lucide-react"

import type { TNavigationConfig } from "../model/types"

import { paths } from "@/shared/config"

export const menuConfig: TNavigationConfig = [
  {
    title: "navigation.home",
    url: paths.home,
    icon: House,
  },
]

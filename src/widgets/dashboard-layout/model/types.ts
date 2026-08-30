import type { LucideIcon } from "lucide-react"

import type { TAppPath } from "@/shared/config"

export interface INavigationSubItem {
  title: string
  url: TAppPath
  isActive?: boolean
}

export interface INavigationItem {
  title: string
  url: TAppPath
  icon?: LucideIcon
  items?: INavigationSubItem[]
}

export type TNavigationConfig = INavigationItem[]

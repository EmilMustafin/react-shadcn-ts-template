import type { FC, ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

import { menuConfig } from "../config/menu.config"

import { Aside } from "./aside/aside"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"
import { Separator } from "@/shared/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar"

interface IDashboardLayoutProps {
  children: ReactNode
}

interface IDashboardLayoutMainProps {
  children: ReactNode
}

interface IDashboardLayoutContentProps {
  children: ReactNode
}

const DashboardLayoutRoot: FC<IDashboardLayoutProps> = ({ children }) => {
  return <SidebarProvider>{children}</SidebarProvider>
}

const DashboardLayoutAside: FC = () => {
  return <Aside />
}

const DashboardLayoutMain: FC<IDashboardLayoutMainProps> = ({ children }) => {
  return <SidebarInset>{children}</SidebarInset>
}

const DashboardLayoutHeader: FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const parentLocation = String(location.pathname.split("/").filter(Boolean)[0] ?? "")

  const { currentSection, currentSubSection } = useMemo(() => {
    const section = menuConfig.find(
      (el) => el.url.includes(parentLocation) || el.url === location.pathname
    )
    const subSection = section?.items?.find((item) => item.url === location.pathname)

    return {
      currentSection: section,
      currentSubSection: subSection,
    }
  }, [location.pathname, parentLocation])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {currentSection ? (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href={currentSection.url}>{t(currentSection.title)}</BreadcrumbLink>
              </BreadcrumbItem>
              {currentSubSection ? (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t(currentSubSection.title)}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : null}
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}

const DashboardLayoutContent: FC<IDashboardLayoutContentProps> = ({ children }) => {
  return <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
}

export const DashboardLayout = {
  Root: DashboardLayoutRoot,
  Aside: DashboardLayoutAside,
  Main: DashboardLayoutMain,
  Header: DashboardLayoutHeader,
  Content: DashboardLayoutContent,
}

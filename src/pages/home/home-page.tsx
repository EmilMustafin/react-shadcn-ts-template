import { BookOpenIcon, RocketIcon, SparklesIcon } from "lucide-react"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"

const HomePage: FC = () => {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <RocketIcon className="text-muted-foreground size-5" />
          <CardTitle>{t("home.welcome.title")}</CardTitle>
          <CardDescription>{t("home.welcome.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("home.welcome.content")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SparklesIcon className="text-muted-foreground size-5" />
          <CardTitle>{t("home.features.title")}</CardTitle>
          <CardDescription>{t("home.features.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground flex list-inside list-disc flex-col gap-1.5 text-sm">
            <li>{t("home.features.list.typescript")}</li>
            <li>{t("home.features.list.tailwind")}</li>
            <li>{t("home.features.list.components")}</li>
            <li>{t("home.features.list.i18n")}</li>
            <li>{t("home.features.list.router")}</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <BookOpenIcon className="text-muted-foreground size-5" />
          <CardTitle>{t("home.documentation.title")}</CardTitle>
          <CardDescription>{t("home.documentation.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("home.documentation.content")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default HomePage

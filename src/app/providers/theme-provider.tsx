import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"
import type { FC } from "react"

export const ThemeProvider: FC<ThemeProviderProps> = (props) => {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <NextThemesProvider {...props} />
}

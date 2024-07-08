import { createContext, useMemo, useState } from 'react'

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

interface ThemeContextType {
  theme: Theme
  changeTheme: (theme: Theme) => void
}

const defaultTheme = (localStorage.getItem('theme') as Theme) ?? Theme.Light

export const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  changeTheme: () => {},
})

export const OwnThemeProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  const changeTheme = (theme: Theme) => {
    localStorage.setItem('theme', theme)
    setTheme(theme)
  }

  const value = useMemo(() => ({ theme, changeTheme }), [theme, changeTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

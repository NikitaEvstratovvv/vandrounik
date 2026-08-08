import { createContext, useContext } from 'react'

export type TabChromeContextValue = {
  forceHidden: boolean
  setForceHidden: (hidden: boolean) => void
}

export const TabChromeContext = createContext<TabChromeContextValue | null>(null)

/** Скрыть / читать hide-флаг tab bar (оверлеи / sheets на хабе). */
export function useTabChrome(): TabChromeContextValue {
  const ctx = useContext(TabChromeContext)
  if (!ctx) {
    return { forceHidden: false, setForceHidden: () => {} }
  }
  return ctx
}

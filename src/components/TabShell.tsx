import { useCallback, useMemo, useState } from 'react'
import { Box } from '@chakra-ui/react'
import { Outlet, useLocation } from 'react-router-dom'
import { Screen } from '@/components/Screen'
import { TabBar } from '@/components/TabBar'
import { TabChromeContext, useTabChrome } from '@/components/tab-chrome'

const ROOT_TABS = new Set(['/plan', '/trips', '/profile'])

/**
 * Authenticated shell: Outlet + TabBar на корневых табах.
 * Бар скрыт на /plan/* overlays (pathname) и при forceHidden (duration sheet и т.п.).
 */
export function TabShell() {
  const [forceHidden, setForceHiddenState] = useState(false)
  const setForceHidden = useCallback((hidden: boolean) => {
    setForceHiddenState(hidden)
  }, [])
  const value = useMemo(() => ({ forceHidden, setForceHidden }), [forceHidden, setForceHidden])

  return (
    <TabChromeContext.Provider value={value}>
      <TabShellLayout />
    </TabChromeContext.Provider>
  )
}

function TabShellLayout() {
  const { pathname } = useLocation()
  const { forceHidden } = useTabChrome()
  const onRootTab = ROOT_TABS.has(pathname)
  const showTabBar = onRootTab && !forceHidden

  return (
    <Screen>
      <Box flex="1" minH="0" display="flex" flexDirection="column" position="relative" overflow="hidden">
        <Outlet />
      </Box>
      {showTabBar ? <TabBar /> : null}
    </Screen>
  )
}

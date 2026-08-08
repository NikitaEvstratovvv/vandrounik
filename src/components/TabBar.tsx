import { Box, Flex, Text } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { PlusIcon, RouteIcon, UserIcon } from '@/components/icons'
import type { ComponentType } from 'react'

type TabDef = {
  to: string
  label: string
  icon: ComponentType<{ size?: number }>
}

const TABS: TabDef[] = [
  { to: '/plan', label: 'Создать', icon: PlusIcon },
  { to: '/trips', label: 'Мои маршруты', icon: RouteIcon },
  { to: '/profile', label: 'Профиль', icon: UserIcon },
]

/**
 * Высота оверлейного TabBar: p8 + pill (p4 + py8 + 24 icon + 16 text).
 * Используй как нижний padding скролла на корневых табах.
 */
export const TAB_BAR_HEIGHT = 80

/**
 * Нижний tab bar — Figma 271:1300 / 271:1255.
 * Только на корневых табах (/plan, /trips, /profile).
 * Позиционируется поверх контента (frost), контент скроллится под ним.
 */
export function TabBar() {
  return (
    <Box
      as="nav"
      aria-label="Основное меню"
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      zIndex={12}
      p="8px"
      w="full"
      pointerEvents="none"
    >
      <Flex
        gap="4px"
        align="center"
        p="4px"
        w="full"
        borderRadius="tab"
        boxShadow="tab"
        overflow="hidden"
        pointerEvents="auto"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {TABS.map((tab) => (
          <TabItem key={tab.to} tab={tab} />
        ))}
      </Flex>
    </Box>
  )
}

function TabItem({ tab }: { tab: TabDef }) {
  const Icon = tab.icon
  return (
    <NavLink
      to={tab.to}
      end
      style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
    >
      {({ isActive }) => (
        <Flex
          direction="column"
          align="center"
          py="8px"
          borderRadius="sheet"
          bg={isActive ? 'secondary' : 'transparent'}
          color={isActive ? 'primary' : 'muted'}
          fontWeight={isActive ? 'medium' : 'normal'}
          cursor="pointer"
          transition="background 150ms, color 150ms"
          _hover={{ opacity: 0.85 }}
          aria-current={isActive ? 'page' : undefined}
        >
          <Box as="span" display="inline-flex" boxSize="24px" flexShrink={0} aria-hidden>
            <Icon size={24} />
          </Box>
          <Text
            as="span"
            fontSize="xs"
            lineHeight="xs"
            textAlign="center"
            w="full"
            fontWeight="inherit"
            color="inherit"
          >
            {tab.label}
          </Text>
        </Flex>
      )}
    </NavLink>
  )
}

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
 * Нижний tab bar — Figma 271:1300 / 271:1255.
 * Только на корневых табах (/plan, /trips, /profile).
 */
export function TabBar() {
  return (
    <Box as="nav" aria-label="Основное меню" flexShrink={0} p="8px" w="full">
      <Flex
        gap="4px"
        align="center"
        p="4px"
        w="full"
        borderRadius="tab"
        boxShadow="tab"
        overflow="hidden"
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

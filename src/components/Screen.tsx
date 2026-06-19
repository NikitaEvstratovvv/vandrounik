import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'

/**
 * Каркас экрана. Базовый макет Figma — 360px ширина, фон холста #f6f6f6.
 * На десктопе показываем как центрированный «телефон» без скругления экрана.
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <Flex
      direction="column"
      position="relative"
      w="100%"
      maxW="360px"
      h="100dvh"
      maxH={{ base: '100dvh', md: '800px' }}
      my={{ base: '0', md: '16px' }}
      bg="screen"
      overflow="hidden"
      boxShadow={{ base: 'none', md: '0 24px 60px rgba(0,0,0,0.18)' }}
    >
      {children}
    </Flex>
  )
}

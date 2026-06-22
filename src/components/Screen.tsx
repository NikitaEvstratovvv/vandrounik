import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'

/** Каркас экрана на всю ширину и высоту viewport. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <Flex
      direction="column"
      position="relative"
      w="100%"
      h="100dvh"
      bg="screen"
      overflow="hidden"
    >
      {children}
    </Flex>
  )
}

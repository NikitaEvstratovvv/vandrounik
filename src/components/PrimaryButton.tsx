import { chakra } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type PrimaryButtonProps = {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
}

/**
 * Основной CTA: primary fill, h-48, rounded-card(20), text-base medium.
 * 1:1 с Figma (node 137:213 / 147:700).
 */
export function PrimaryButton({ children, onClick, disabled = false }: PrimaryButtonProps) {
  return (
    <chakra.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      w="full"
      h="48px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="16px"
      py="8px"
      bg="primary"
      color="primaryFg"
      fontFamily="body"
      fontSize="base"
      fontWeight="medium"
      lineHeight="base"
      borderRadius="card"
      boxShadow="btn"
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.92 }}
      _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
    >
      {children}
    </chakra.button>
  )
}

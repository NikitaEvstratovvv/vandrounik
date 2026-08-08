import { chakra } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type PrimaryButtonProps = {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
}

/**
 * Основной CTA: primary fill, h-48, rounded-card(20), text-base medium.
 * 1:1 с Figma (node 137:213 / 147:700).
 * variant="secondary" — outlined, bg прозрачный.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  type = 'button',
}: PrimaryButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <chakra.button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      w="full"
      h="48px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px="16px"
      py="8px"
      bg={isPrimary ? 'primary' : 'transparent'}
      color={isPrimary ? 'primaryFg' : 'primary'}
      border={isPrimary ? 'none' : '1px solid'}
      borderColor={isPrimary ? undefined : 'primary'}
      fontFamily="body"
      fontSize="base"
      fontWeight="medium"
      lineHeight="base"
      borderRadius="card"
      boxShadow={isPrimary ? 'btn' : 'none'}
      cursor="pointer"
      transition="opacity 150ms"
      _hover={{ opacity: 0.85 }}
      _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
    >
      {children}
    </chakra.button>
  )
}

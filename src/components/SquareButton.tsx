import { Flex } from '@chakra-ui/react'
import type { ReactNode } from 'react'

type SquareButtonProps = {
  children: ReactNode
  ariaLabel: string
  onClick?: () => void
  /** secondary — серая заливка (виджеты); outline — белая с рамкой (swap); ghost — без рамки (close). */
  variant?: 'secondary' | 'outline' | 'ghost'
  /** Не перехватывать клик (когда вся карточка — кнопка). */
  asVisual?: boolean
}

/** Квадратная кнопка 36×36 с иконкой 16/20px. 1:1 с Figma (radius-lg = 10px). */
export function SquareButton({
  children,
  ariaLabel,
  onClick,
  variant = 'secondary',
  asVisual = false,
}: SquareButtonProps) {
  return (
    <Flex
      as={asVisual ? 'div' : 'button'}
      aria-label={asVisual ? undefined : ariaLabel}
      aria-hidden={asVisual ? true : undefined}
      onClick={asVisual ? undefined : onClick}
      boxSize="36px"
      flexShrink={0}
      align="center"
      justify="center"
      borderRadius="btn"
      color="primary"
      cursor={asVisual ? 'default' : 'pointer'}
      bg={variant === 'secondary' ? 'secondary' : 'background'}
      borderWidth={variant === 'outline' ? '1px' : '0'}
      borderColor="line"
      pointerEvents={asVisual ? 'none' : undefined}
      transition="opacity 150ms"
      _hover={asVisual ? undefined : { opacity: 0.75 }}
    >
      {children}
    </Flex>
  )
}

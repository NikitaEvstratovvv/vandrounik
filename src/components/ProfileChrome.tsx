import { Box, Flex, Image, Text, type FlexProps } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { ChevronRight } from '@/components/icons'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SquareButton } from '@/components/SquareButton'

/** Enter fade for profile hub / step swaps — see skill `vandrounik-motion`. */
export const PROFILE_FADE_IN_CSS = {
  animation: 'vandr-fade-in 280ms ease-out',
  '@keyframes vandr-fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
} as const

export function ProfileFadeIn({ children, ...rest }: FlexProps & { children: ReactNode }) {
  return (
    <Flex css={PROFILE_FADE_IN_CSS} {...rest}>
      {children}
    </Flex>
  )
}

type ProfileNavRowProps = {
  label: string
  value?: string
  onClick: () => void
}

/** Строка настроек / меню профиля — Figma white card + SquareButton chevron. */
export function ProfileNavRow({ label, value, onClick }: ProfileNavRowProps) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      w="full"
      align="center"
      gap="12px"
      px="16px"
      py="12px"
      bg="background"
      borderRadius="card"
      cursor="pointer"
      textAlign="left"
      transition="opacity 150ms"
      _hover={{ opacity: 0.9 }}
    >
      <Flex
        direction="column"
        flex="1"
        minW="0"
        gap={value ? '2px' : '4px'}
        justify="center"
        minH="42px"
      >
        <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" truncate>
          {label}
        </Text>
        {value ? (
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" truncate>
            {value}
          </Text>
        ) : null}
      </Flex>
      <SquareButton ariaLabel="" asVisual variant="secondary">
        <ChevronRight size={16} />
      </SquareButton>
    </Flex>
  )
}

type ProfileStatCardProps = {
  value: number | string
  label: string
}

export function ProfileStatCard({ value, label }: ProfileStatCardProps) {
  return (
    <Flex
      flex="1"
      minW="0"
      direction="column"
      align="center"
      justify="center"
      gap="2px"
      h="72px"
      px="16px"
      py="12px"
      bg="background"
      borderRadius="card"
      textAlign="center"
    >
      <Text
        fontFamily="heading"
        fontWeight="semibold"
        fontSize="20px"
        lineHeight="28px"
        color="primary"
        textTransform="uppercase"
      >
        {value}
      </Text>
      <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" w="full">
        {label}
      </Text>
    </Flex>
  )
}

type ProfileSuccessProps = {
  title: string
  subtitle?: string
  onBack: () => void
  ctaLabel?: string
}

export function ProfileSuccess({
  title,
  subtitle,
  onBack,
  ctaLabel = 'Вернуться к настройкам',
}: ProfileSuccessProps) {
  return (
    <ProfileFadeIn direction="column" flex="1" minH="0" h="full" bg="screen">
      <Flex flex="1" direction="column" align="center" justify="center" p="16px" gap="16px">
        <Box boxSize="200px" flexShrink={0}>
          <Image src="/figma/success-check.png" alt="" w="full" h="full" objectFit="contain" />
        </Box>
        <Text
          fontFamily="heading"
          fontWeight="semibold"
          fontSize="sheetTitle"
          lineHeight="title"
          color="primary"
          textAlign="center"
          textTransform="uppercase"
          w="full"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize="sm" lineHeight="sm" color="primary" textAlign="center" w="full">
            {subtitle}
          </Text>
        ) : null}
      </Flex>
      <Box px="16px" pb="16px">
        <PrimaryButton onClick={onBack}>{ctaLabel}</PrimaryButton>
      </Box>
    </ProfileFadeIn>
  )
}

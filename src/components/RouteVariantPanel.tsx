import { Box, Flex, Text } from '@chakra-ui/react'
import { ChevronLeft, ChevronRight } from '@/components/icons'
import { formatPlacesCount, formatTripMinutes } from '@/lib/format'
import type { RouteVariant } from '@/types'

const CAROUSEL_TRANSITION = 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)'

type RouteVariantPanelProps = {
  variants: RouteVariant[]
  index: number
  onPrev: () => void
  onNext: () => void
  onCardClick: () => void
}

function MetricDot() {
  return (
    <Text as="span" fontSize="xs" lineHeight="xs" color="muted" px="4px" aria-hidden>
      ·
    </Text>
  )
}

function VariantCard({
  variant,
  onClick,
}: {
  variant: RouteVariant
  onClick: () => void
}) {
  return (
    <Flex
      as="button"
      w="full"
      minW="0"
      align="center"
      bg="background"
      borderRadius="12px"
      boxShadow="lg"
      pl="16px"
      pr="12px"
      py="12px"
      cursor="pointer"
      textAlign="left"
      onClick={onClick}
      _hover={{ opacity: 0.92 }}
    >
      <Flex direction="column" gap="4px" minW="0" flex="1">
        <Text
          pt="2px"
          fontFamily="heading"
          fontWeight="semibold"
          fontSize="sm"
          lineHeight="sm"
          color="primary"
          textTransform="uppercase"
          truncate
        >
          {variant.title}
        </Text>
        <Flex align="center" minW="0">
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {Math.round(variant.totalKm)} км
          </Text>
          <MetricDot />
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {formatTripMinutes(variant.totalMinutes)}
          </Text>
          <MetricDot />
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap" truncate>
            {formatPlacesCount(variant.stops.length)}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

/** Панель варианта маршрута: стрелки + карусель карточек (Figma node 216:1055). */
export function RouteVariantPanel({
  variants,
  index,
  onPrev,
  onNext,
  onCardClick,
}: RouteVariantPanelProps) {
  if (variants.length === 0) return null

  const safeIndex = Math.min(Math.max(index, 0), variants.length - 1)
  const slideShare = 100 / variants.length

  return (
    <Flex align="center" gap="6px" w="full">
      <Box
        as="button"
        aria-label="Предыдущий вариант"
        flexShrink={0}
        w="37px"
        h="66px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="background"
        borderRadius="12px"
        boxShadow="lg"
        cursor="pointer"
        onClick={onPrev}
        _hover={{ opacity: 0.9 }}
      >
        <ChevronLeft size={24} />
      </Box>

      <Box flex="1" minW="0" overflow="hidden" borderRadius="12px">
        <Flex
          w={`${variants.length * 100}%`}
          transform={`translate3d(-${safeIndex * slideShare}%, 0, 0)`}
          transition={CAROUSEL_TRANSITION}
          willChange="transform"
        >
          {variants.map((variant) => (
            <Box key={variant.id} flex={`0 0 ${slideShare}%`} minW="0" pr={0}>
              <VariantCard variant={variant} onClick={onCardClick} />
            </Box>
          ))}
        </Flex>
      </Box>

      <Box
        as="button"
        aria-label="Следующий вариант"
        flexShrink={0}
        w="37px"
        h="66px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="background"
        borderRadius="12px"
        boxShadow="lg"
        cursor="pointer"
        onClick={onNext}
        _hover={{ opacity: 0.9 }}
      >
        <ChevronRight size={24} />
      </Box>
    </Flex>
  )
}

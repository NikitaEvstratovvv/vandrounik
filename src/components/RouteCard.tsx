import { Box, Text, VStack } from '@chakra-ui/react'
import { RouteMapPreview } from '@/components/RouteMapPreview'
import { formatRouteMetrics } from '@/lib/format'
import { routePlacesCount } from '@/lib/routing/routeStops'
import type { RouteVariant } from '@/types'

type RouteCardProps = {
  variant: RouteVariant
  onSelect: () => void
}

/** Карточка варианта маршрута на E2. */
export function RouteCard({ variant, onSelect }: RouteCardProps) {
  const tags = variant.interestLabels.join(', ')
  const placesCount = routePlacesCount(variant.stops)

  return (
    <Box
      as="button"
      w="full"
      textAlign="left"
      bg="background"
      borderRadius="card"
      borderWidth="1px"
      borderColor="line"
      overflow="hidden"
      cursor="pointer"
      transition="border-color 150ms, box-shadow 150ms"
      _hover={{ borderColor: 'primary', boxShadow: 'xs' }}
      onClick={onSelect}
    >
      <VStack align="stretch" gap="12px" p="12px">
        <RouteMapPreview stops={variant.stops} geometry={variant.geometry} />

        <VStack align="stretch" gap="4px" px="4px" pb="4px">
          <Text fontSize="base" fontWeight="medium" lineHeight="base" color="foreground">
            {variant.title}
          </Text>
          <Text fontSize="sm" lineHeight="sm" color="muted">
            {formatRouteMetrics(placesCount, variant.totalKm, variant.totalMinutes)}
          </Text>
          {tags ? (
            <Text fontSize="xs" lineHeight="xs" color="muted" truncate>
              {tags}
            </Text>
          ) : null}
        </VStack>
      </VStack>
    </Box>
  )
}

import { Box, Flex, Text } from '@chakra-ui/react'
import { ArrowRightLong } from '@/components/icons'
import { formatPlacesCount, formatTripMinutes } from '@/lib/format'
import { routePlacesCount } from '@/lib/routing/routeStops'
import type { SavedTrip, TripStatus } from '@/lib/storage/trips'

type TripCardProps = {
  trip: SavedTrip
  onSelect: () => void
}

const STATUS_LABEL: Record<Exclude<TripStatus, 'new'>, string> = {
  completed: 'Завершен',
  'in-progress': 'В пути',
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}.${mm}.${yyyy}, ${hh}:${min}`
}

function tripEndpoints(trip: SavedTrip): { start: string; end: string } {
  const origin = trip.params?.originTitle?.trim()
  const destination = trip.params?.destinationTitle?.trim()
  if (origin && destination) return { start: origin, end: destination }

  const stops = trip.variant.stops
  const first = stops[0]?.name?.trim()
  const last = stops[stops.length - 1]?.name?.trim()
  return {
    start: first || 'Старт',
    end: last || 'Финиш',
  }
}

function MetaDot() {
  return (
    <Flex boxSize="16px" align="center" justify="center" flexShrink={0} aria-hidden>
      <Box boxSize="3px" transform="rotate(45deg)" bg="muted" opacity={0.45} />
    </Flex>
  )
}

/** Карточка сохранённого маршрута на E5. Figma 272:1227 / 304:1925 / 305:2845. */
export function TripCard({ trip, onSelect }: TripCardProps) {
  const { start, end } = tripEndpoints(trip)
  const places = routePlacesCount(trip.variant.stops)
  const status = trip.status ?? 'new'
  const showBadge = status !== 'new'
  const savedLabel = formatSavedAt(trip.savedAt)

  return (
    <Box
      as="button"
      type="button"
      w="full"
      flexShrink={0}
      textAlign="left"
      bg="background"
      borderRadius="card"
      overflow="hidden"
      px="16px"
      py="14px"
      cursor="pointer"
      transition="opacity 150ms, box-shadow 150ms"
      _hover={{ opacity: 0.92, boxShadow: 'xs' }}
      onClick={onSelect}
    >
      <Flex direction="column" gap="8px" pb="12px" w="full">
        <Flex align="flex-start" w="full" gap="8px">
          <Text
            flex="1"
            minW="0"
            fontFamily="heading"
            fontWeight="semibold"
            fontSize="base"
            lineHeight="xs"
            color="primary"
            textTransform="uppercase"
            py="1px"
          >
            {trip.variant.title}
          </Text>
          {showBadge ? (
            <Flex
              h="22px"
              align="center"
              justify="center"
              px="10px"
              py="2px"
              flexShrink={0}
              borderRadius="btn"
              bg={status === 'in-progress' ? 'primary' : 'secondary'}
            >
              <Text
                fontSize="xs"
                fontWeight="medium"
                lineHeight="xs"
                color={status === 'in-progress' ? 'background' : 'foreground'}
                whiteSpace="nowrap"
              >
                {STATUS_LABEL[status]}
              </Text>
            </Flex>
          ) : null}
        </Flex>

        <Flex align="center" flexWrap="wrap" gap="4px" w="full">
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {start}
          </Text>
          <Box color="muted" flexShrink={0} display="inline-flex">
            <ArrowRightLong size={16} />
          </Box>
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {end}
          </Text>
        </Flex>
      </Flex>

      <Box h="0" borderTopWidth="1px" borderColor="line" w="full" />

      <Flex align="center" pt="12px" w="full" gap="8px">
        <Flex flex="1" minW="0" align="center">
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {Math.round(trip.variant.totalKm)} км
          </Text>
          <MetaDot />
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {formatTripMinutes(trip.variant.totalMinutes)}
          </Text>
          <MetaDot />
          <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {formatPlacesCount(places)}
          </Text>
        </Flex>
        {savedLabel ? (
          <Text
            fontSize="xs"
            fontWeight="medium"
            lineHeight="xs"
            color="muted"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            {savedLabel}
          </Text>
        ) : null}
      </Flex>
    </Box>
  )
}

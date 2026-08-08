import { Flex, Text } from '@chakra-ui/react'
import { FlagIcon } from '@/components/icons'
import { formatDriveMinutes } from '@/lib/format'
import { formatPlaceTypeLabel } from '@/data/placeTaxonomy'
import { routeStopLabel } from '@/lib/routing/routeStops'
import type { RouteStop } from '@/types'

type StopRowProps = {
  stop: RouteStop
}

function StopBadge({ stop }: { stop: RouteStop }) {
  const isStart = stop.placeId === 'origin'
  const isFinish = stop.placeId === 'destination'

  if (isStart || isFinish) {
    return (
      <Flex
        boxSize="28px"
        flexShrink={0}
        align="center"
        justifyContent="center"
        bg={isStart ? 'primary' : 'secondary'}
        color={isStart ? 'primaryFg' : 'primary'}
        borderRadius="12px"
        minW="28px"
        aria-label={isStart ? 'Старт' : 'Финиш'}
      >
        <FlagIcon size={14} />
      </Flex>
    )
  }

  return (
    <Flex
      boxSize="28px"
      flexShrink={0}
      align="center"
      justifyContent="center"
      bg="secondary"
      borderRadius="12px"
      px="6px"
      minW="28px"
    >
      <Text fontSize="xs" fontWeight="semibold" color="primary" lineHeight="1">
        {routeStopLabel(stop)}
      </Text>
    </Flex>
  )
}

/** Строка остановки в шите деталей маршрута (Figma node 217:1014). */
export function StopRow({ stop }: StopRowProps) {
  return (
    <Flex align="center" gap="12px" pl="16px" w="full" bg="background" flexShrink={0}>
      <StopBadge stop={stop} />

      <Flex direction="column" gap="2px" flex="1" minW="0" py="11px" pr="16px">
        <Flex align="center" gap="12px" w="full" minW="0">
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary" truncate flex="1" minW="0">
            {stop.name}
          </Text>
          <Text
            fontSize="xs"
            fontWeight="normal"
            lineHeight="sm"
            color="muted"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            {formatDriveMinutes(stop.driveMinutesToNext)}
          </Text>
        </Flex>
        <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" truncate>
          {formatPlaceTypeLabel(stop.type, stop.typeGroupLabel)}
        </Text>
      </Flex>
    </Flex>
  )
}

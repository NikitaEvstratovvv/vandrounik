import { Flex, Text } from '@chakra-ui/react'
import { formatDriveMinutes } from '@/lib/format'
import type { RouteStop } from '@/types'

type StopRowProps = {
  stop: RouteStop
}

/** Строка остановки в шите деталей маршрута (Figma node 217:1014). */
export function StopRow({ stop }: StopRowProps) {
  return (
    <Flex align="center" gap="12px" pl="16px" w="full" bg="background" flexShrink={0}>
      <Flex
        boxSize="28px"
        flexShrink={0}
        align="center"
        justifyContent="center"
        bg="secondary"
        borderRadius="12px"
      >
        <Text fontSize="xs" fontWeight="semibold" color="primary" lineHeight="1">
          {stop.order}
        </Text>
      </Flex>

      <Flex direction="column" gap="2px" flex="1" minW="0" py="11px">
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary" truncate>
          {stop.name}
        </Text>
        <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" truncate>
          {stop.type}
        </Text>
      </Flex>

      <Flex align="center" justifyContent="center" h="full" pr="16px" flexShrink={0} alignSelf="stretch">
        <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" whiteSpace="nowrap">
          {formatDriveMinutes(stop.driveMinutesToNext ?? 45)}
        </Text>
      </Flex>
    </Flex>
  )
}

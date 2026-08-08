import { chakra, Flex, Text } from '@chakra-ui/react'
import { CheckIcon, FlagIcon } from '@/components/icons'
import { formatDriveMinutes } from '@/lib/format'
import { formatPlaceTypeLabel } from '@/data/placeTaxonomy'
import { routeStopLabel } from '@/lib/routing/routeStops'
import type { RouteStop } from '@/types'

type RouteDetailStopRowProps = {
  stop: RouteStop
  selected?: boolean
  visited?: boolean
  onSelect?: () => void
  onToggleVisited?: () => void
}

/** Строка остановки на E3: название, время в пути, отметка «Был здесь». */
export function RouteDetailStopRow({
  stop,
  selected = false,
  visited = false,
  onSelect,
  onToggleVisited,
}: RouteDetailStopRowProps) {
  return (
    <Flex
      align="center"
      gap="12px"
      w="full"
      px="12px"
      py="10px"
      bg={selected ? 'secondary' : 'background'}
      borderRadius="btn"
      borderWidth="1px"
      borderColor={selected ? 'line' : 'transparent'}
      cursor={onSelect ? 'pointer' : 'default'}
      transition="background 150ms, border-color 150ms"
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect()
              }
            }
          : undefined
      }
      _hover={onSelect ? { bg: selected ? 'secondary' : 'rgba(245,245,245,0.85)' } : undefined}
    >
      <Flex
        minW="28px"
        h="28px"
        px={stop.placeId === 'origin' || stop.placeId === 'destination' ? '0' : '6px'}
        flexShrink={0}
        align="center"
        justifyContent="center"
        bg={
          stop.placeId === 'origin'
            ? 'primary'
            : stop.placeId === 'destination'
              ? 'secondary'
              : visited
                ? 'primary'
                : 'secondary'
        }
        color={
          stop.placeId === 'origin'
            ? 'primaryFg'
            : stop.placeId === 'destination'
              ? 'primary'
              : visited
                ? 'primaryFg'
                : 'primary'
        }
        borderRadius="12px"
        transition="background 150ms, color 150ms"
        aria-label={
          stop.placeId === 'origin' ? 'Старт' : stop.placeId === 'destination' ? 'Финиш' : undefined
        }
      >
        {stop.placeId === 'origin' || stop.placeId === 'destination' ? (
          <FlagIcon size={14} />
        ) : (
          <Text fontSize="xs" fontWeight="semibold" lineHeight="1">
            {routeStopLabel(stop)}
          </Text>
        )}
      </Flex>

      <Flex direction="column" gap="2px" flex="1" minW="0">
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary" truncate>
          {stop.name}
        </Text>
        <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" truncate>
          {formatPlaceTypeLabel(stop.type, stop.typeGroupLabel)}
          {stop.driveMinutesToNext ? ` · ${formatDriveMinutes(stop.driveMinutesToNext)}` : ''}
        </Text>
      </Flex>

      {onToggleVisited ? <VisitedToggle visited={visited} onToggle={onToggleVisited} /> : null}
    </Flex>
  )
}

function VisitedToggle({ visited, onToggle }: { visited: boolean; onToggle: () => void }) {
  return (
    <chakra.button
      type="button"
      flexShrink={0}
      h="32px"
      display="inline-flex"
      alignItems="center"
      gap="4px"
      px="10px"
      borderRadius="pill"
      fontSize="xs"
      fontWeight="medium"
      lineHeight="xs"
      whiteSpace="nowrap"
      bg={visited ? 'primary' : 'background'}
      color={visited ? 'primaryFg' : 'muted'}
      borderWidth="1px"
      borderColor={visited ? 'primary' : 'line'}
      cursor="pointer"
      transition="background 150ms, color 150ms, border-color 150ms"
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      _hover={{ opacity: 0.92 }}
      aria-pressed={visited}
      aria-label={visited ? 'Снять отметку «Был здесь»' : 'Отметить «Был здесь»'}
    >
      {visited ? <CheckIcon size={12} strokeWidth={2.5} /> : null}
      Был здесь
    </chakra.button>
  )
}

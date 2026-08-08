import { Box, Flex, Text, chakra } from '@chakra-ui/react'
import { FlagIcon, UndoIcon } from '@/components/icons'
import { formatDriveMinutes } from '@/lib/format'
import { formatPlaceTypeLabel } from '@/data/placeTaxonomy'
import { isRouteEndpoint, isRoutePlaceStop, routeStopLabel } from '@/lib/routing/routeStops'
import type { RouteStop } from '@/types'

type TripStopRowProps = {
  stop: RouteStop
  index: number
  total: number
  visited?: boolean
  /** Whether the next stop’s badge is filled (primary) — drives connector gradient. */
  nextActive?: boolean
  /** When true, show «Был здесь» / undo (in-progress / completed). */
  showVisitedActions?: boolean
  onSelect?: () => void
  onToggleVisited?: () => void
}

/** Filled (primary) badge — Figma 306:1601 stepper. */
export function tripStopBadgeActive(stop: RouteStop, visited: boolean): boolean {
  if (stop.placeId === 'origin') return true
  if (stop.placeId === 'destination') return false
  return isRoutePlaceStop(stop) && visited
}

/**
 * Connector between this badge and the next (Figma 306:1637–306:1643).
 * primary↔secondary linear gradients on state change; solid when both match.
 */
function connectorCss(fromActive: boolean, toActive: boolean): Record<string, string> {
  if (fromActive && toActive) {
    return { background: 'var(--chakra-colors-primary)' }
  }
  if (!fromActive && !toActive) {
    return { background: 'var(--chakra-colors-secondary)' }
  }
  if (fromActive && !toActive) {
    return {
      background:
        'linear-gradient(to bottom, var(--chakra-colors-primary), var(--chakra-colors-secondary))',
    }
  }
  return {
    background:
      'linear-gradient(to bottom, var(--chakra-colors-secondary), var(--chakra-colors-primary))',
  }
}

function MetaDot() {
  return (
    <Flex boxSize="15px" h="16px" align="center" justify="center" flexShrink={0} aria-hidden>
      <Box boxSize="3px" transform="rotate(45deg)" bg="muted" opacity={0.45} />
    </Flex>
  )
}

/**
 * Stop row for E6 trip manage list (Figma 305:2309 / in-progress stepper 306:1601).
 * Timeline connectors use solid + primary↔secondary gradients between badges.
 */
export function TripStopRow({
  stop,
  index,
  total,
  visited = false,
  nextActive = false,
  showVisitedActions = false,
  onSelect,
  onToggleVisited,
}: TripStopRowProps) {
  const isLast = index === total - 1
  const endpoint = isRouteEndpoint(stop)
  const place = isRoutePlaceStop(stop)
  const active = tripStopBadgeActive(stop, visited)
  const driveLabel = stop.driveMinutesToNext ? formatDriveMinutes(stop.driveMinutesToNext) : null

  return (
    <Flex
      align="center"
      gap="12px"
      w="full"
      px="16px"
      position="relative"
      cursor={onSelect ? 'pointer' : 'default'}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
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
      _hover={onSelect ? { bg: 'rgba(245,245,245,0.85)' } : undefined}
      transition="background 150ms"
    >
      {!isLast ? (
        <Box
          position="absolute"
          left="29px"
          top="calc(50% + 14px)"
          w="2px"
          h="calc(100% - 28px)"
          zIndex={0}
          aria-hidden
          css={connectorCss(active, nextActive)}
        />
      ) : null}

      <Flex
        boxSize="28px"
        flexShrink={0}
        align="center"
        justifyContent="center"
        bg={active ? 'primary' : 'secondary'}
        color={active ? 'primaryFg' : 'primary'}
        borderRadius="12px"
        overflow="hidden"
        zIndex={1}
        transition="background 150ms, color 150ms"
        aria-label={
          stop.placeId === 'origin' ? 'Старт' : stop.placeId === 'destination' ? 'Финиш' : undefined
        }
      >
        {endpoint ? (
          <FlagIcon size={14} />
        ) : (
          <Text fontSize="xs" fontWeight="semibold" lineHeight="1">
            {routeStopLabel(stop)}
          </Text>
        )}
      </Flex>

      <Flex direction="column" gap="2px" flex="1" minW="0" py="11px" overflow="hidden">
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="primary" truncate>
          {stop.name}
        </Text>
        <Flex align="center" gap="2px" minW="0">
          <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" whiteSpace="nowrap">
            {formatPlaceTypeLabel(stop.type, stop.typeGroupLabel)}
          </Text>
          {driveLabel ? (
            <>
              <MetaDot />
              <Text
                fontSize="xs"
                fontWeight="normal"
                lineHeight="xs"
                color="muted"
                whiteSpace="nowrap"
              >
                {driveLabel}
              </Text>
            </>
          ) : null}
        </Flex>
      </Flex>

      {showVisitedActions && place && onToggleVisited ? (
        visited ? (
          <chakra.button
            type="button"
            flexShrink={0}
            h="36px"
            px="10px"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            bg="secondary"
            borderRadius="btn"
            color="primary"
            cursor="pointer"
            transition="opacity 150ms"
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisited()
            }}
            _hover={{ opacity: 0.85 }}
            aria-label="Снять отметку «Был здесь»"
          >
            <UndoIcon size={16} />
          </chakra.button>
        ) : (
          <chakra.button
            type="button"
            flexShrink={0}
            h="36px"
            w="96px"
            px="8px"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            bg="background"
            borderWidth="1px"
            borderColor="line"
            borderRadius="btn"
            fontSize="sm"
            fontWeight="medium"
            lineHeight="sm"
            color="foreground"
            whiteSpace="nowrap"
            cursor="pointer"
            transition="opacity 150ms"
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisited()
            }}
            _hover={{ opacity: 0.85 }}
            aria-label="Отметить «Был здесь»"
          >
            Был здесь
          </chakra.button>
        )
      ) : null}
    </Flex>
  )
}

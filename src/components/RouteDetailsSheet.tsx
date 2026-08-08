import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Image, Text, VStack, chakra } from '@chakra-ui/react'
import { CloseIcon } from '@/components/icons'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SquareButton } from '@/components/SquareButton'
import { StopRow } from '@/components/StopRow'
import { formatPlacesCount, formatTripMinutes } from '@/lib/format'
import {
  googleMapsRouteUrl,
  openExternalMap,
  yandexMapsRouteUrl,
} from '@/lib/maps/externalMaps'
import { routePlacesCount } from '@/lib/routing/routeStops'
import type { RouteVariant } from '@/types'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`

type RouteDetailsSheetProps = {
  open: boolean
  variant: RouteVariant
  onClose: () => void
  onExited: () => void
  onSave: () => void
}

function MetricDot() {
  return (
    <Text as="span" fontSize="sm" lineHeight="sm" color="muted" px="4px" aria-hidden>
      ·
    </Text>
  )
}

type MapChipProps = {
  label: string
  iconSrc: string
  onClick: () => void
}

/** Pill chip — Figma 272:1091 / 272:1097. Icon is full 24×24 mark (circle + glyph). */
function MapChip({ label, iconSrc, onClick }: MapChipProps) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      gap="6px"
      h="36px"
      pl="6px"
      pr="12px"
      bg="background"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="line"
      borderRadius="20px"
      cursor="pointer"
      flexShrink={0}
      transition="opacity 150ms, border-color 150ms"
      _hover={{ opacity: 0.85 }}
    >
      <Box boxSize="24px" flexShrink={0} overflow="hidden" borderRadius="full">
        <Image src={iconSrc} alt="" w="24px" h="24px" display="block" />
      </Box>
      <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="foreground" whiteSpace="nowrap">
        {label}
      </Text>
    </chakra.button>
  )
}

/** Шит деталей маршрута (Figma node 217:948 / frame 216:1056). */
export function RouteDetailsSheet({ open, variant, onClose, onExited, onSave }: RouteDetailsSheetProps) {
  const [visible, setVisible] = useState(false)
  const [motionReady, setMotionReady] = useState(false)
  const onExitedRef = useRef(onExited)
  const placesCount = routePlacesCount(variant.stops)

  useEffect(() => {
    onExitedRef.current = onExited
  }, [onExited])

  useEffect(() => {
    if (open) {
      setVisible(false)
      setMotionReady(false)
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMotionReady(true)
          setVisible(true)
        })
      })
      return () => cancelAnimationFrame(frame)
    }

    setMotionReady(true)
    setVisible(false)
  }, [open])

  const handleTransitionEnd = (event: React.TransitionEvent) => {
    if (event.propertyName !== 'transform') return
    if (open) return
    onExitedRef.current()
  }

  return (
    <Box
      position="absolute"
      left="50%"
      bottom="8px"
      zIndex={10}
      w="calc(100% - 16px)"
      maxW="720px"
      maxH="calc(100% - 96px)"
      bg="background"
      borderRadius="28px"
      overflow="hidden"
      pointerEvents={open || visible ? 'auto' : 'none'}
      aria-hidden={!open && !visible}
      display="flex"
      flexDirection="column"
      boxShadow={visible ? 'lg' : 'none'}
      transform={
        visible
          ? 'translate3d(-50%, 0, 0)'
          : 'translate3d(-50%, calc(100% + 8px), 0)'
      }
      transition={motionReady ? SHEET_TRANSITION : 'none'}
      willChange="transform"
      onTransitionEnd={handleTransitionEnd}
    >
      <Flex gap="8px" align="flex-start" p="16px" flexShrink={0}>
        <VStack align="stretch" gap="4px" flex="1" minW="0">
          <Text
            fontFamily="heading"
            fontWeight="semibold"
            fontSize="sheetTitle"
            lineHeight="title"
            color="primary"
            textTransform="uppercase"
          >
            {variant.title}
          </Text>
          <Flex align="center" minW="0" flexWrap="nowrap">
            <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" whiteSpace="nowrap">
              {Math.round(variant.totalKm)} км
            </Text>
            <MetricDot />
            <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" whiteSpace="nowrap">
              {formatTripMinutes(variant.totalMinutes)}
            </Text>
            <MetricDot />
            <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" whiteSpace="nowrap" truncate>
              {formatPlacesCount(placesCount)}
            </Text>
          </Flex>
        </VStack>
        <SquareButton ariaLabel="Закрыть" onClick={onClose}>
          <CloseIcon size={16} />
        </SquareButton>
      </Flex>

      <Flex
        flexWrap="wrap"
        gap="8px"
        px="16px"
        pb="12px"
        flexShrink={0}
        align="flex-start"
      >
        <MapChip
          label="Яндекс карта"
          iconSrc="/figma/map-yandex.svg"
          onClick={() => openExternalMap(yandexMapsRouteUrl(variant.stops))}
        />
        <MapChip
          label="Google map"
          iconSrc="/figma/map-google.svg"
          onClick={() => openExternalMap(googleMapsRouteUrl(variant.stops))}
        />
      </Flex>

      <Box flex="0 1 auto" minH={0} overflowY="auto" overscrollBehavior="contain">
        {variant.stops.map((stop) => (
          <StopRow key={`${stop.placeId}-${stop.order}`} stop={stop} />
        ))}
      </Box>

      <Box p="8px" flexShrink={0}>
        <PrimaryButton onClick={onSave}>Сохранить</PrimaryButton>
      </Box>
    </Box>
  )
}

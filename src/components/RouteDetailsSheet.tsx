import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { CloseIcon } from '@/components/icons'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SquareButton } from '@/components/SquareButton'
import { StopRow } from '@/components/StopRow'
import { formatPlacesCount, formatTripMinutes } from '@/lib/format'
import type { RouteVariant } from '@/types'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`

type RouteDetailsSheetProps = {
  open: boolean
  variant: RouteVariant
  onClose: () => void
  onExited: () => void
  onSelect: () => void
}

function MetricDot() {
  return (
    <Text as="span" fontSize="sm" lineHeight="sm" color="muted" px="4px" aria-hidden>
      ·
    </Text>
  )
}

/** Шит деталей маршрута (Figma node 217:948). */
export function RouteDetailsSheet({ open, variant, onClose, onExited, onSelect }: RouteDetailsSheetProps) {
  const [visible, setVisible] = useState(false)
  const [motionReady, setMotionReady] = useState(false)
  const onExitedRef = useRef(onExited)

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
      left="8px"
      right="8px"
      bottom="8px"
      zIndex={10}
      maxH="calc(100% - 96px)"
      bg="background"
      borderRadius="28px"
      overflow="hidden"
      pointerEvents={open || visible ? 'auto' : 'none'}
      aria-hidden={!open && !visible}
      display="flex"
      flexDirection="column"
      boxShadow={visible ? 'lg' : 'none'}
      transform={visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, calc(100% + 8px), 0)'}
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
              {formatPlacesCount(variant.stops.length)}
            </Text>
          </Flex>
        </VStack>
        <SquareButton ariaLabel="Закрыть" onClick={onClose}>
          <CloseIcon size={16} />
        </SquareButton>
      </Flex>

      <Box flex="0 1 auto" minH={0} overflowY="auto" overscrollBehavior="contain">
        {variant.stops.map((stop) => (
          <StopRow key={`${stop.placeId}-${stop.order}`} stop={stop} />
        ))}
      </Box>

      <Box p="8px" flexShrink={0}>
        <PrimaryButton onClick={onSelect}>Выбрать</PrimaryButton>
      </Box>
    </Box>
  )
}

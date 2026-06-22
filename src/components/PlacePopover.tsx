import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { CloseIcon } from '@/components/icons'
import { SquareButton } from '@/components/SquareButton'
import type { RouteStop } from '@/types'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`

type PlacePopoverProps = {
  open: boolean
  stop: RouteStop
  onClose: () => void
  onExited: () => void
}

function OutlinePillButton({ children }: { children: string }) {
  return (
    <Box
      as="button"
      h="36px"
      px="16px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="background"
      borderWidth="1px"
      borderColor="line"
      borderRadius="card"
      fontSize="sm"
      fontWeight="medium"
      lineHeight="sm"
      color="foreground"
      cursor="pointer"
      _hover={{ opacity: 0.9 }}
    >
      {children}
    </Box>
  )
}

function PlaceImagePlaceholder() {
  return (
    <Flex
      h="160px"
      w="full"
      borderRadius="sm"
      bg="secondary"
      align="center"
      justifyContent="center"
      color="muted"
    >
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
        <path d="m3 16 5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </Flex>
  )
}

/** Поповер достопримечательности на карте (Figma node 220:1326). */
export function PlacePopover({ open, stop, onClose, onExited }: PlacePopoverProps) {
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
      left="50%"
      bottom="8px"
      zIndex={10}
      w="calc(100% - 16px)"
      maxW="720px"
      maxH="calc(100% - 96px)"
      bg="background"
      borderRadius="28px"
      overflow="hidden"
      pointerEvents="auto"
      boxShadow={visible ? 'lg' : 'none'}
      display="flex"
      flexDirection="column"
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
            {stop.name}
          </Text>
          <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted">
            {stop.type}
          </Text>
        </VStack>
        <SquareButton ariaLabel="Закрыть" onClick={onClose}>
          <CloseIcon size={16} />
        </SquareButton>
      </Flex>

      <Box flex="0 1 auto" minH={0} overflowY="auto" overscrollBehavior="contain">
        <VStack align="stretch" gap="16px" px="16px" pb="24px">
          <PlaceImagePlaceholder />

          <Flex gap="8px">
            <OutlinePillButton>Карта</OutlinePillButton>
            <OutlinePillButton>Wiki</OutlinePillButton>
          </Flex>

          <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="primary">
            {stop.description ??
              'Описание места появится после подключения каталога достопримечательностей.'}
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}

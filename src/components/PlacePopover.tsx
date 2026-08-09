import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Image, Text, VStack, chakra } from '@chakra-ui/react'
import { CloseIcon } from '@/components/icons'
import { SquareButton } from '@/components/SquareButton'
import {
  googleMapsPointUrl,
  openExternalMap,
  openExternalUrl,
  yandexMapsPointUrl,
} from '@/lib/maps/externalMaps'
import type { RouteStop } from '@/types'
import { formatPlaceDescription, formatPlaceTypeLabel } from '@/data/placeTaxonomy'

const DURATION_MS = 280
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SHEET_TRANSITION = `transform ${DURATION_MS}ms ${EASE}`

type PlacePopoverProps = {
  open: boolean
  stop: RouteStop
  onClose: () => void
  onExited: () => void
}

function MapChip({ label, iconSrc, onClick }: { label: string; iconSrc: string; onClick: () => void }) {
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
      transition="opacity 150ms"
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

function OutlinePillButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <Box
      as="button"
      onClick={onClick}
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

function PlacePhoto({ src }: { src: string }) {
  return (
    <Box h="160px" w="full" borderRadius="sm" overflow="hidden" bg="secondary" flexShrink={0}>
      <Image src={src} alt="" w="full" h="full" objectFit="cover" display="block" />
    </Box>
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

  const point = { lat: stop.lat, lng: stop.lng }

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
            {formatPlaceTypeLabel(stop.type, stop.typeGroupLabel)}
          </Text>
        </VStack>
        <SquareButton ariaLabel="Закрыть" onClick={onClose}>
          <CloseIcon size={16} />
        </SquareButton>
      </Flex>

      <Box flex="0 1 auto" minH={0} overflowY="auto" overscrollBehavior="contain">
        <VStack align="stretch" gap="16px" px="16px" pb="24px">
          {stop.imageUrl ? <PlacePhoto src={stop.imageUrl} /> : null}

          <Flex flexWrap="wrap" gap="8px">
            <MapChip
              label="Яндекс карта"
              iconSrc="/figma/map-yandex.svg"
              onClick={() => openExternalMap(yandexMapsPointUrl(point))}
            />
            <MapChip
              label="Google map"
              iconSrc="/figma/map-google.svg"
              onClick={() => openExternalMap(googleMapsPointUrl(point))}
            />
            {stop.wikipediaUrl ? (
              <OutlinePillButton onClick={() => openExternalUrl(stop.wikipediaUrl)}>Wiki</OutlinePillButton>
            ) : null}
          </Flex>

          <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="primary">
            {formatPlaceDescription(stop.description) ??
              'Описание места появится после подключения каталога достопримечательностей.'}
          </Text>
        </VStack>
      </Box>
    </Box>
  )
}

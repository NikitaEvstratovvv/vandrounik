import { Text } from '@chakra-ui/react'
import type { ReactNode } from 'react'
import { MAP_LABEL_FONT_SIZE, MAP_LABEL_HEIGHT, MAP_LABEL_MAX_WIDTH } from '@/lib/map/resolveMapLabelVisibility'

const LABEL_HALO_SHADOW =
  '1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff, ' +
  '1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff'

type MapStopLabelProps = {
  children: ReactNode
}

/** Подпись POI на карте (10px Medium + белый halo). */
export function MapStopLabel({ children }: MapStopLabelProps) {
  return (
    <Text
      w="full"
      m={0}
      fontSize={`${MAP_LABEL_FONT_SIZE}px`}
      fontWeight="medium"
      lineHeight={`${MAP_LABEL_HEIGHT}px`}
      color="foreground"
      maxW={`${MAP_LABEL_MAX_WIDTH}px`}
      textAlign="center"
      whiteSpace="normal"
      overflowWrap="break-word"
      pointerEvents="none"
      textShadow={LABEL_HALO_SHADOW}
      css={{
        paintOrder: 'stroke fill',
        WebkitTextStroke: '1px #ffffff',
      }}
    >
      {children}
    </Text>
  )
}

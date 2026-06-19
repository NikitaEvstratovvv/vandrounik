import type { ReactNode } from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { MinusIcon, PlusIcon } from '@/components/icons'

type MapZoomControlsProps = {
  onZoomIn: () => void
  onZoomOut: () => void
}

/** Кнопки зума карты (Figma node 217:1100 / 217:1101). */
export function MapZoomControls({ onZoomIn, onZoomOut }: MapZoomControlsProps) {
  return (
    <Flex
      direction="column"
      gap="6px"
      position="absolute"
      right="16px"
      top="50%"
      transform="translateY(-50%)"
      zIndex={2}
      pointerEvents="auto"
    >
      <ZoomButton ariaLabel="Приблизить" onClick={onZoomIn}>
        <PlusIcon size={24} />
      </ZoomButton>
      <ZoomButton ariaLabel="Отдалить" onClick={onZoomOut}>
        <MinusIcon size={24} />
      </ZoomButton>
    </Flex>
  )
}

function ZoomButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Box
      as="button"
      aria-label={ariaLabel}
      w="40px"
      h="40px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="background"
      borderRadius="12px"
      color="foreground"
      cursor="pointer"
      boxShadow="xs"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      _hover={{ opacity: 0.92 }}
    >
      {children}
    </Box>
  )
}

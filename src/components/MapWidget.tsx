import { Box, Flex, Text } from '@chakra-ui/react'
import { SquareButton } from '@/components/SquareButton'
import { ArrowDownUp } from '@/components/icons'
import { useWizard } from '@/store/wizard-context'
import type { Place } from '@/types'

type MapWidgetProps = {
  onOpenOrigin: () => void
  onOpenDestination: () => void
}

/**
 * Виджет выбора направления на E1. Одна карточка: «Откуда» + «Куда»,
 * графика маршрута слева и кнопка swap. 1:1 с Figma (node 137:261 / 132:173).
 */
export function MapWidget({ onOpenOrigin, onOpenDestination }: MapWidgetProps) {
  const { state, swapPoints } = useWizard()

  return (
    <Flex bg="background" borderRadius="card" overflow="hidden" w="full" align="flex-start">
      {/* Графика маршрута (точка — линия — точка) */}
      <Flex p="16px" alignSelf="stretch" flexShrink={0}>
        <Flex direction="column" align="center" w="16px">
          <OriginMark />
          <Box h="35px" w="0" borderLeftWidth="1.5px" borderStyle="dashed" borderColor="primary" my="2px" />
          <DestinationMark />
        </Flex>
      </Flex>

      {/* Поля «Откуда» / «Куда» */}
      <Flex direction="column" flex="1" minW="0" pr="16px" py="16px" gap="9px" position="relative">
        <PointRow label="Откуда" place={state.origin} onClick={onOpenOrigin} />
        <Box h="1px" w="full" bg="line" />
        <PointRow label="Куда" place={state.destination} onClick={onOpenDestination} />

        <Box position="absolute" right="16px" top="50%" transform="translateY(-50%)">
          <SquareButton variant="outline" ariaLabel="Поменять местами" onClick={swapPoints}>
            <ArrowDownUp size={16} />
          </SquareButton>
        </Box>
      </Flex>
    </Flex>
  )
}

function PointRow({ label, place, onClick }: { label: string; place: Place | null; onClick: () => void }) {
  return (
    <Flex
      as="button"
      onClick={onClick}
      direction="column"
      justify="center"
      align="flex-start"
      textAlign="left"
      h="36px"
      w="full"
      pr="40px"
      cursor="pointer"
      _hover={{ opacity: 0.7 }}
    >
      <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="muted" truncate w="full">
        {label}
      </Text>
      <Text
        fontSize="sm"
        fontWeight="medium"
        lineHeight="sm"
        color={place ? 'primary' : 'muted'}
        truncate
        w="full"
      >
        {place ? place.title : 'Выбрать'}
      </Text>
    </Flex>
  )
}

function OriginMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="5" stroke="#171717" strokeWidth="5" fill="#ffffff" />
    </svg>
  )
}

function DestinationMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="8" fill="#171717" />
    </svg>
  )
}

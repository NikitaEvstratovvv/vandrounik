import { Flex, Text } from '@chakra-ui/react'
import { SquareButton } from '@/components/SquareButton'
import { ChevronRight } from '@/components/icons'
import { useWizard } from '@/store/wizard-context'
import { formatDuration, activeDurationValue } from '@/lib/format'

type DurationWidgetProps = {
  onOpen: () => void
}

/** Виджет длительности на E1. empty/filled. 1:1 с Figma (node 132:246 / 132:237). */
export function DurationWidget({ onOpen }: DurationWidgetProps) {
  const { state } = useWizard()
  const filled = state.duration !== null && activeDurationValue(state.duration) !== null

  return (
    <Flex
      as="button"
      onClick={onOpen}
      aria-label="Длительность поездки"
      bg="background"
      borderRadius="card"
      w="full"
      align="center"
      gap="12px"
      px="16px"
      py={filled ? '15px' : '16px'}
      textAlign="left"
      cursor="pointer"
      _hover={{ opacity: 0.92 }}
    >
      <Flex direction="column" flex="1" minW="0" gap={filled ? '2px' : '0'} justify="center">
        {filled ? (
          <>
            <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="primary">
              Длительность
            </Text>
            <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary" truncate w="full">
              {formatDuration(state.duration!)}
            </Text>
          </>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary">
            Длительность поездки
          </Text>
        )}
      </Flex>

      <SquareButton ariaLabel="Открыть" asVisual>
        <ChevronRight size={16} />
      </SquareButton>
    </Flex>
  )
}

import { Flex, Text } from '@chakra-ui/react'
import { SquareButton } from '@/components/SquareButton'
import { ChevronRight } from '@/components/icons'
import { INTERESTS } from '@/data/interests'
import { useWizard } from '@/store/wizard-context'

type ViewWidgetProps = {
  onOpen: () => void
}

const MAX_BADGES = 2

/** Виджет «Что посмотреть» на E1. empty/filled. 1:1 с Figma (node 132:218 / 132:209). */
export function ViewWidget({ onOpen }: ViewWidgetProps) {
  const { state } = useWizard()
  const selected = INTERESTS.filter((i) => state.interests.includes(i.id))
  const filled = selected.length > 0

  const visible = selected.slice(0, MAX_BADGES)
  const rest = selected.length - visible.length

  return (
    <Flex
      as="button"
      onClick={onOpen}
      aria-label="Что посмотреть"
      bg="background"
      borderRadius="card"
      w="full"
      align="center"
      gap="12px"
      px="16px"
      py={filled ? '14px' : '15px'}
      textAlign="left"
      cursor="pointer"
      _hover={{ opacity: 0.92 }}
    >
      <Flex direction="column" flex="1" minW="0" gap={filled ? '6px' : '0'} justify="center">
        {filled ? (
          <>
            <Text fontSize="xs" fontWeight="normal" lineHeight="xs" color="primary">
              Что посмотреть
            </Text>
            <Flex gap="4px" align="center" flexWrap="wrap">
              {visible.map((i) => (
                <Badge key={i.id}>{i.title}</Badge>
              ))}
              {rest > 0 && <Badge>{`+${rest}`}</Badge>}
            </Flex>
          </>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" lineHeight="sm" color="primary">
            Что посмотреть
          </Text>
        )}
      </Flex>

      <SquareButton ariaLabel="Открыть" asVisual>
        <ChevronRight size={16} />
      </SquareButton>
    </Flex>
  )
}

function Badge({ children }: { children: string }) {
  return (
    <Flex
      h="22px"
      align="center"
      justify="center"
      px="10px"
      py="2px"
      bg="secondary"
      borderRadius="btn"
    >
      <Text fontSize="xs" fontWeight="medium" lineHeight="xs" color="secondaryFg" whiteSpace="nowrap">
        {children}
      </Text>
    </Flex>
  )
}

import { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { CheckIcon } from '@/components/icons'
import { INTERESTS } from '@/data/interests'
import { useWizard } from '@/store/wizard-context'
import type { InterestId } from '@/types'

type InterestsPanelProps = {
  onClose: () => void
}

/** S2 — Что посмотреть (выбор категорий). 1:1 с Figma (node 147:667). */
export function InterestsPanel({ onClose }: InterestsPanelProps) {
  const { state, setInterests } = useWizard()
  const [selected, setSelected] = useState<InterestId[]>(state.interests)

  const toggle = (id: InterestId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const apply = () => {
    setInterests(selected)
    onClose()
  }

  return (
    <>
      <Header variant="back" title="Что посмотреть" onBack={onClose} />

      <Flex direction="column" flex="1" minH="0" px="16px" pb="16px" gap="12px" overflowY="auto">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest.id)
          return (
            <Flex
              key={interest.id}
              as="button"
              onClick={() => toggle(interest.id)}
              aria-pressed={isSelected}
              w="full"
              align="center"
              gap="16px"
              textAlign="left"
              px="16px"
              py="12px"
              bg="background"
              borderRadius="card"
              borderWidth="1px"
              borderColor={isSelected ? 'primary' : 'line'}
              cursor="pointer"
              transition="border-color 150ms"
            >
              <Flex direction="column" flex="1" minW="0" gap="4px">
                <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="foreground">
                  {interest.title}
                </Text>
                <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="muted">
                  {interest.description}
                </Text>
              </Flex>
              <Checkbox checked={isSelected} />
            </Flex>
          )
        })}
      </Flex>

      <Box p="16px">
        <PrimaryButton onClick={apply} disabled={selected.length === 0}>
          Сохранить
        </PrimaryButton>
      </Box>
    </>
  )
}

function Checkbox({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <Flex
        boxSize="20px"
        flexShrink={0}
        align="center"
        justifyContent="center"
        bg="primary"
        color="primaryFg"
        borderRadius="7.5px"
        boxShadow="check"
      >
        <CheckIcon size={15} />
      </Flex>
    )
  }
  return <Box boxSize="20px" flexShrink={0} bg="background" borderWidth="1px" borderColor="line" borderRadius="checkbox" />
}

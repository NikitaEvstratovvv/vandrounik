import { useState } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { CheckIcon, MinusIcon } from '@/components/icons'
import { INTERESTS } from '@/data/interests'
import { useWizard } from '@/store/wizard-context'
import type { InterestId } from '@/types'

type InterestsPanelProps = {
  onClose: () => void
}

const ALL_IDS = INTERESTS.map((i) => i.id)

/** S2 — Что посмотреть (выбор категорий). 1:1 с Figma (node 147:667). */
export function InterestsPanel({ onClose }: InterestsPanelProps) {
  const { state, setInterests } = useWizard()
  const [selected, setSelected] = useState<InterestId[]>(state.interests)

  const allSelected = selected.length === ALL_IDS.length
  const someSelected = selected.length > 0 && !allSelected

  const toggle = (id: InterestId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelected(allSelected ? [] : [...ALL_IDS])
  }

  const apply = () => {
    setInterests(selected)
    onClose()
  }

  return (
    <>
      <Header variant="back" title="Что посмотреть" onBack={onClose} />

      <Flex direction="column" flex="1" minH="0" px="16px" pb="16px" gap="12px" overflowY="auto">
        <InterestRow
          title="Всё интересное по пути"
          description="От ДОТов до замков"
          selected={allSelected}
          indeterminate={someSelected}
          onToggle={toggleAll}
        />
        {INTERESTS.map((interest) => (
          <InterestRow
            key={interest.id}
            title={interest.title}
            description={interest.description}
            selected={selected.includes(interest.id)}
            onToggle={() => toggle(interest.id)}
          />
        ))}
      </Flex>

      <Box p="16px">
        <PrimaryButton onClick={apply} disabled={selected.length === 0}>
          Сохранить
        </PrimaryButton>
      </Box>
    </>
  )
}

function InterestRow({
  title,
  description,
  selected,
  indeterminate = false,
  onToggle,
}: {
  title: string
  description: string
  selected: boolean
  indeterminate?: boolean
  onToggle: () => void
}) {
  const active = selected || indeterminate
  const ariaChecked = indeterminate ? 'mixed' : selected

  return (
    <Flex
      as="button"
      onClick={onToggle}
      aria-checked={ariaChecked}
      role="checkbox"
      w="full"
      align="center"
      gap="16px"
      textAlign="left"
      px="16px"
      py="12px"
      bg="background"
      borderRadius="card"
      borderWidth="1px"
      borderColor={active ? 'primary' : 'line'}
      cursor="pointer"
      transition="border-color 150ms"
    >
      <Flex direction="column" flex="1" minW="0" gap="4px">
        <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="foreground">
          {title}
        </Text>
        <Text fontSize="sm" fontWeight="normal" lineHeight="sm" color="muted">
          {description}
        </Text>
      </Flex>
      <Checkbox checked={selected} indeterminate={indeterminate} />
    </Flex>
  )
}

function Checkbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean
  indeterminate?: boolean
}) {
  if (checked || indeterminate) {
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
        {indeterminate ? <MinusIcon size={15} strokeWidth={2.5} /> : <CheckIcon size={15} />}
      </Flex>
    )
  }
  return <Box boxSize="20px" flexShrink={0} bg="background" borderWidth="1px" borderColor="line" borderRadius="checkbox" />
}

import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { AuthField } from '@/components/AuthShell'
import { ProfileSuccess } from '@/components/ProfileChrome'
import { loadSession, updateSession } from '@/lib/storage/auth'

type ProfileNamePanelProps = {
  onClose: () => void
}

/** Смена имени — Figma 350:2088 → success 350:2114. */
export function ProfileNamePanel({ onClose }: ProfileNamePanelProps) {
  const session = loadSession()
  const [name, setName] = useState(session?.displayName ?? '')
  const [done, setDone] = useState(false)

  if (!session) return <Navigate to="/" replace />

  if (done) {
    return <ProfileSuccess title="Имя сохранено" onBack={onClose} />
  }

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && trimmed !== session.displayName

  const save = () => {
    if (!canSave) return
    updateSession({ displayName: trimmed, username: trimmed })
    setDone(true)
  }

  return (
    <Flex direction="column" flex="1" minH="0" h="full" bg="screen">
      <Header variant="back" title="Имя" onBack={onClose} />
      <Flex flex="1" direction="column" pt="16px" px="16px">
        <AuthField
          value={name}
          onChange={setName}
          placeholder="Имя"
          autoComplete="name"
          aria-label="Имя"
        />
      </Flex>
      <Box px="16px" pb="16px">
        <PrimaryButton onClick={save} disabled={!canSave}>
          Сохранить
        </PrimaryButton>
      </Box>
    </Flex>
  )
}

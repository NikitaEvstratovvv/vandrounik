import { Flex } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { ProfileNavRow } from '@/components/ProfileChrome'
import { loadSession } from '@/lib/storage/auth'

type ProfileSettingsPanelProps = {
  onClose: () => void
  onOpenPhoto: () => void
  onOpenName: () => void
  onOpenEmail: () => void
}

/** Настройки профиля — Figma 350:2045 / filled 351:2148. */
export function ProfileSettingsPanel({
  onClose,
  onOpenPhoto,
  onOpenName,
  onOpenEmail,
}: ProfileSettingsPanelProps) {
  const session = loadSession()

  return (
    <Flex direction="column" flex="1" minH="0" h="full" bg="screen">
      <Header variant="back" title="Настройки" onBack={onClose} />
      <Flex direction="column" flex="1" gap="8px" pt="16px" px="16px" overflowY="auto">
        <ProfileNavRow label="Фото профиля" onClick={onOpenPhoto} />
        <ProfileNavRow label="Имя" value={session?.displayName} onClick={onOpenName} />
        <ProfileNavRow label="Почта" value={session?.email} onClick={onOpenEmail} />
      </Flex>
    </Flex>
  )
}

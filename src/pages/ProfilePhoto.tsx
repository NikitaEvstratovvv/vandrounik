import { useRef, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Box, Flex, Image } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { PenIcon, PlusIcon } from '@/components/icons'
import { loadSession, updateSession } from '@/lib/storage/auth'
import {
  AVATAR_PRESETS,
  DEFAULT_AVATAR,
  avatarsEqual,
  resizeImageFile,
  type ProfileAvatar,
} from '@/lib/profile/avatar'

type ProfilePhotoPanelProps = {
  onClose: () => void
}

/** Смена фото — Figma 351:2207 / 351:2310 / uploaded 351:2328. */
export function ProfilePhotoPanel({ onClose }: ProfilePhotoPanelProps) {
  const session = loadSession()
  const fileRef = useRef<HTMLInputElement>(null)
  const initial = session?.avatar ?? DEFAULT_AVATAR
  const [draft, setDraft] = useState<ProfileAvatar>(initial)
  const dirty = !avatarsEqual(draft, initial)

  if (!session) return <Navigate to="/" replace />

  const onUpload = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImageFile(file)
      setDraft({ kind: 'custom', dataUrl })
    } catch {
      // ignore bad files
    }
  }

  const save = () => {
    if (!dirty) return
    updateSession({ avatar: draft })
    onClose()
  }

  const isSelectedPreset = (id: string) => draft.kind === 'preset' && draft.id === id
  const isCustomSelected = draft.kind === 'custom'

  return (
    <Flex direction="column" flex="1" minH="0" h="full" bg="screen">
      <Header variant="back" title="Фото профиля" onBack={onClose} />

      <Flex direction="column" flex="1" gap="16px" pt="16px" px="16px" overflowY="auto">
        <Box
          display="grid"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          gap="16px"
          w="full"
        >
          {AVATAR_PRESETS.map((preset) => {
            const selected = isSelectedPreset(preset.id)
            return (
              <AvatarCell
                key={preset.id}
                selected={selected}
                onClick={() => setDraft({ kind: 'preset', id: preset.id })}
                ariaLabel={preset.label}
              >
                <Image src={preset.src} alt={preset.label} boxSize="full" objectFit="cover" />
              </AvatarCell>
            )
          })}

          <AvatarCell
            selected={isCustomSelected}
            onClick={() => fileRef.current?.click()}
            ariaLabel={isCustomSelected ? 'Изменить фото' : 'Загрузить фото'}
            bg="background"
          >
            {isCustomSelected ? (
              <>
                <Image
                  src={draft.dataUrl}
                  alt=""
                  position="absolute"
                  inset="0"
                  boxSize="full"
                  objectFit="cover"
                />
                {/* Figma 351:2348 — black @ 30% over uploaded photo */}
                <Box position="absolute" inset="0" bg="canvas" opacity={0.3} aria-hidden />
                <Box position="relative" zIndex={1} color="background" display="flex">
                  <PenIcon size={20} />
                </Box>
              </>
            ) : (
              <PlusIcon size={24} />
            )}
          </AvatarCell>
        </Box>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void onUpload(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </Flex>

      <Box px="16px" pb="16px">
        <PrimaryButton onClick={save} disabled={!dirty}>
          Сохранить
        </PrimaryButton>
      </Box>
    </Flex>
  )
}

type AvatarCellProps = {
  selected: boolean
  onClick: () => void
  ariaLabel: string
  bg?: string
  children: ReactNode
}

function AvatarCell({ selected, onClick, ariaLabel, bg, children }: AvatarCellProps) {
  return (
    <Box
      as="button"
      aria-label={ariaLabel}
      onClick={onClick}
      position="relative"
      w="full"
      aspectRatio="1"
      borderRadius="full"
      overflow="hidden"
      bg={bg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderWidth="3px"
      borderColor={selected ? 'foreground' : 'transparent'}
      cursor="pointer"
      outline="none"
      color="foreground"
      transition="opacity 150ms, border-color 150ms"
      _hover={{ opacity: 0.9 }}
    >
      {children}
    </Box>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Box, Flex, Image, Text, chakra } from '@chakra-ui/react'
import { ProfileFadeIn, ProfileNavRow, ProfileStatCard } from '@/components/ProfileChrome'
import { SlideOverlay } from '@/components/SlideOverlay'
import { TAB_BAR_HEIGHT } from '@/components/TabBar'
import { useTabChrome } from '@/components/tab-chrome'
import { clearSession, loadSession } from '@/lib/storage/auth'
import { loadVisitedPlaceIds } from '@/lib/storage/visited'
import { loadGeneration } from '@/lib/storage/generation'
import { avatarSrc } from '@/lib/profile/avatar'
import { ProfileSettingsPanel } from '@/pages/ProfileSettings'
import { ProfilePhotoPanel } from '@/pages/ProfilePhoto'
import { ProfileNamePanel } from '@/pages/ProfileName'
import { ProfileEmailPanel } from '@/pages/ProfileEmail'

function isSettingsStackPath(pathname: string) {
  return pathname === '/profile/settings' || pathname.startsWith('/profile/settings/')
}

function emailStepFromPath(pathname: string): 'email' | 'code' | 'done' {
  if (pathname.endsWith('/done')) return 'done'
  if (pathname.endsWith('/code')) return 'code'
  return 'email'
}

/** E8 — Профиль. Figma 308:2061. Nested settings use SlideOverlay (see vandrounik-motion). */
export function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setForceHidden } = useTabChrome()
  const session = loadSession()

  const placesSeen = useMemo(() => loadVisitedPlaceIds().size, [])
  const routesCreated = useMemo(() => (loadGeneration() ? 1 : 0), [])

  const isSettingsStack = isSettingsStackPath(location.pathname)
  const isPhoto = location.pathname === '/profile/settings/photo'
  const isName = location.pathname === '/profile/settings/name'
  const isEmail = location.pathname.startsWith('/profile/settings/email')

  const [settingsOpen, setSettingsOpen] = useState(() => isSettingsStack)
  const [photoOpen, setPhotoOpen] = useState(() => isPhoto)
  const [nameOpen, setNameOpen] = useState(() => isName)
  const [emailOpen, setEmailOpen] = useState(() => isEmail)

  useEffect(() => {
    if (isSettingsStack) setSettingsOpen(true)
  }, [isSettingsStack])

  useEffect(() => {
    if (isPhoto) setPhotoOpen(true)
  }, [isPhoto])

  useEffect(() => {
    if (isName) setNameOpen(true)
  }, [isName])

  useEffect(() => {
    if (isEmail) setEmailOpen(true)
  }, [isEmail])

  const closeSettings = () => setSettingsOpen(false)
  const handleSettingsEntered = () => {
    if (!isSettingsStack) {
      navigate('/profile/settings', { replace: true })
    }
  }
  const handleSettingsExited = () => {
    if (isSettingsStack) {
      navigate('/profile', { replace: true })
    }
  }

  const openPhoto = () => setPhotoOpen(true)
  const closePhoto = () => setPhotoOpen(false)
  const handlePhotoEntered = () => {
    if (!isPhoto) {
      navigate('/profile/settings/photo', { replace: true })
    }
  }
  const handlePhotoExited = () => {
    if (isPhoto) {
      navigate('/profile/settings', { replace: true })
    }
  }

  const openName = () => setNameOpen(true)
  const closeName = () => setNameOpen(false)
  const handleNameEntered = () => {
    if (!isName) {
      navigate('/profile/settings/name', { replace: true })
    }
  }
  const handleNameExited = () => {
    if (isName) {
      navigate('/profile/settings', { replace: true })
    }
  }

  const openEmail = () => setEmailOpen(true)
  const closeEmail = () => setEmailOpen(false)
  const handleEmailEntered = () => {
    if (!isEmail) {
      navigate('/profile/settings/email', { replace: true })
    }
  }
  const handleEmailExited = () => {
    if (isEmail) {
      navigate('/profile/settings', { replace: true })
    }
  }
  const backToEmailForm = () => {
    navigate('/profile/settings/email', { replace: true })
  }

  const photoPresent = isPhoto || photoOpen
  const namePresent = isName || nameOpen
  const emailPresent = isEmail || emailOpen
  const panelOpen = settingsOpen || photoOpen || nameOpen || emailOpen

  useEffect(() => {
    setForceHidden(panelOpen)
    return () => setForceHidden(false)
  }, [panelOpen, setForceHidden])

  if (!session) return <Navigate to="/" replace />

  const logout = () => {
    clearSession()
    navigate('/', { replace: true })
  }

  return (
    <Flex direction="column" flex="1" minH="0" h="full" position="relative" overflow="hidden">
      <ProfileFadeIn direction="column" flex="1" minH="0" h="full" overflow="hidden">
        <Box h="80px" flexShrink={0} aria-hidden />

        <Flex direction="column" align="center" px="16px" pb="16px" flexShrink={0}>
          <Image
            src={avatarSrc(session.avatar)}
            alt=""
            boxSize="128px"
            borderRadius="full"
            objectFit="cover"
          />
        </Flex>

        <Flex
          direction="column"
          flex="1"
          minH="0"
          px="16px"
          pb="16px"
          gap="24px"
          overflowY={panelOpen ? 'hidden' : 'auto'}
        >
          <Flex direction="column" gap="4px" textAlign="center" w="full">
            <Text
              fontFamily="heading"
              fontWeight="semibold"
              fontSize="20px"
              lineHeight="28px"
              color="primary"
              textTransform="uppercase"
              w="full"
            >
              {session.displayName}
            </Text>
            <Text fontSize="sm" fontWeight="medium" lineHeight="sm" color="muted" w="full">
              {session.email}
            </Text>
          </Flex>

          <Flex direction="column" gap="8px" w="full">
            <Flex gap="8px" w="full">
              <ProfileStatCard value={placesSeen} label="Посещено мест" />
              <ProfileStatCard value={routesCreated} label="Создано маршрутов" />
            </Flex>

            <ProfileNavRow label="Настройки" onClick={() => setSettingsOpen(true)} />
          </Flex>
        </Flex>

        <Box px="16px" pt="8px" pb={`${TAB_BAR_HEIGHT}px`} flexShrink={0}>
          <chakra.button
            type="button"
            onClick={logout}
            w="full"
            h="48px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="transparent"
            color="foreground"
            fontSize="base"
            fontWeight="medium"
            lineHeight="base"
            borderRadius="card"
            cursor="pointer"
            transition="opacity 150ms"
            _hover={{ opacity: 0.75 }}
          >
            Выйти из аккаунта
          </chakra.button>
        </Box>
      </ProfileFadeIn>

      <SlideOverlay
        open={settingsOpen}
        onEntered={handleSettingsEntered}
        onExited={handleSettingsExited}
      >
        <ProfileSettingsPanel
          onClose={closeSettings}
          onOpenPhoto={openPhoto}
          onOpenName={openName}
          onOpenEmail={openEmail}
        />
      </SlideOverlay>

      {photoPresent ? (
        <SlideOverlay
          open={photoOpen}
          onEntered={handlePhotoEntered}
          onExited={handlePhotoExited}
          zIndex={16}
        >
          <ProfilePhotoPanel onClose={closePhoto} />
        </SlideOverlay>
      ) : null}

      {namePresent ? (
        <SlideOverlay
          open={nameOpen}
          onEntered={handleNameEntered}
          onExited={handleNameExited}
          zIndex={16}
        >
          <ProfileNamePanel onClose={closeName} />
        </SlideOverlay>
      ) : null}

      {emailPresent ? (
        <SlideOverlay
          open={emailOpen}
          onEntered={handleEmailEntered}
          onExited={handleEmailExited}
          zIndex={16}
        >
          <ProfileEmailPanel
            step={emailStepFromPath(location.pathname)}
            onClose={closeEmail}
            onBackToEmail={backToEmailForm}
          />
        </SlideOverlay>
      ) : null}
    </Flex>
  )
}

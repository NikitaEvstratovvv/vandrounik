import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Header } from '@/components/Header'
import { PrimaryButton } from '@/components/PrimaryButton'
import { AuthField, AuthFieldError } from '@/components/AuthShell'
import { ProfileFadeIn, ProfileSuccess } from '@/components/ProfileChrome'
import {
  clearEmailChangePending,
  EMAIL_HINT,
  isValidEmail,
  isValidMockCode,
  loadEmailChangePending,
  loadSession,
  saveEmailChangePending,
  updateSession,
} from '@/lib/storage/auth'

type ProfileEmailPanelProps = {
  step: 'email' | 'code' | 'done'
  onClose: () => void
  onBackToEmail: () => void
}

/** Почта / код / успех — Figma 332:1568 → 332:1642 → 332:1673. */
export function ProfileEmailPanel({ step, onClose, onBackToEmail }: ProfileEmailPanelProps) {
  if (step === 'done') {
    return (
      <ProfileSuccess
        title="Почта сохранена"
        subtitle="Указывайте ее при входе в приложение"
        onBack={onClose}
      />
    )
  }

  return (
    <ProfileFadeIn key={step} direction="column" flex="1" minH="0" h="full">
      {step === 'email' ? <ProfileEmailForm onClose={onClose} /> : null}
      {step === 'code' ? <ProfileEmailCodeForm onBack={onBackToEmail} /> : null}
    </ProfileFadeIn>
  )
}

function ProfileEmailForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const session = loadSession()
  const [email, setEmail] = useState(session?.email ?? '')
  const [showError, setShowError] = useState(false)

  if (!session) return <Navigate to="/" replace />

  const trimmed = email.trim().toLowerCase()
  const changed = trimmed.length > 0 && trimmed !== session.email
  const canContinue = changed && isValidEmail(email)

  const validate = () => {
    if (!changed) {
      setShowError(false)
      return false
    }
    const ok = isValidEmail(email)
    setShowError(!ok)
    return ok
  }

  const submit = () => {
    if (!canContinue || !validate()) return
    saveEmailChangePending(email)
    navigate('/profile/settings/email/code', { replace: true })
  }

  return (
    <Flex direction="column" flex="1" minH="0" h="full" bg="screen">
      <Header variant="back" title="Почта" onBack={onClose} />
      <Flex flex="1" direction="column" gap="16px" pt="16px" px="16px">
        <Text fontSize="sm" lineHeight="sm" color="primary">
          Укажите новую почту, которую хотите привязать
        </Text>
        <Flex direction="column" gap="8px" w="full">
          <AuthField
            value={email}
            onChange={setEmail}
            onBlur={validate}
            placeholder="Email"
            type="text"
            inputMode="email"
            autoComplete="email"
            invalid={showError}
          />
          {showError ? <AuthFieldError>{EMAIL_HINT}</AuthFieldError> : null}
        </Flex>
      </Flex>
      <Box px="16px" pb="16px">
        <PrimaryButton onClick={submit} disabled={!canContinue}>
          Отправить код
        </PrimaryButton>
      </Box>
    </Flex>
  )
}

function ProfileEmailCodeForm({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate()
  const session = loadSession()
  const pending = loadEmailChangePending()
  const [code, setCode] = useState('')

  if (!session) return <Navigate to="/" replace />
  if (!pending) return <Navigate to="/profile/settings/email" replace />

  const canSubmit = isValidMockCode(code)

  const submit = () => {
    if (!canSubmit) return
    void updateSession({ email: pending.email }).then(() => {
      clearEmailChangePending()
      navigate('/profile/settings/email/done', { replace: true })
    })
  }

  return (
    <Flex direction="column" flex="1" minH="0" h="full" bg="screen">
      <Header variant="back" title="Почта" onBack={onBack} />
      <Flex flex="1" direction="column" gap="16px" pt="16px" px="16px">
        <Text fontSize="sm" lineHeight="sm" color="primary">
          Подтвердите смену почты кодом из письма
        </Text>
        <AuthField
          value={code}
          onChange={setCode}
          placeholder="Код"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label="Код из письма"
        />
      </Flex>
      <Box px="16px" pb="16px">
        <PrimaryButton onClick={submit} disabled={!canSubmit}>
          Сохранить
        </PrimaryButton>
      </Box>
    </Flex>
  )
}

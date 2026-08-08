import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Flex, Text } from '@chakra-ui/react'
import {
  AuthField,
  AuthFieldError,
  AuthForm,
  AuthShell,
  AuthSubmit,
  GoogleAuthButton,
} from '@/components/AuthShell'
import { RedirectIfAuthed } from '@/components/RequireAuth'
import {
  createEmailSession,
  createGoogleSession,
  EMAIL_HINT,
  isValidEmail,
  isValidMockCode,
  loadPending,
  savePending,
} from '@/lib/storage/auth'

function useGoogleSignIn() {
  const navigate = useNavigate()
  return () => {
    createGoogleSession()
    navigate('/plan', { replace: true })
  }
}

/** A0 — Email (+ error state Figma 320:1711 / 320:1734). Node 320:1635. */
export function AuthEmailPage() {
  const navigate = useNavigate()
  const signInGoogle = useGoogleSignIn()
  const [email, setEmail] = useState('')
  const [showError, setShowError] = useState(false)

  const validate = () => {
    const ok = isValidEmail(email)
    setShowError(!ok)
    return ok
  }

  const submit = () => {
    if (!validate()) return
    savePending(email)
    navigate('/auth/code', { replace: true })
  }

  return (
    <RedirectIfAuthed>
      <AuthShell>
        <AuthForm onSubmit={submit}>
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
          <AuthSubmit />
          <GoogleAuthButton onClick={signInGoogle} />
        </AuthForm>
      </AuthShell>
    </RedirectIfAuthed>
  )
}

/** A1 — Код из письма. Figma node 332:1521. После кода — сразу /plan. */
export function AuthCodePage() {
  const navigate = useNavigate()
  const signInGoogle = useGoogleSignIn()
  const pending = loadPending()
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)

  if (!pending) {
    return <Navigate to="/" replace />
  }

  const showError = touched && !isValidMockCode(code)

  const submit = () => {
    setTouched(true)
    if (!isValidMockCode(code)) return
    createEmailSession(pending.email)
    navigate('/plan', { replace: true })
  }

  return (
    <RedirectIfAuthed>
      <AuthShell>
        <AuthForm onSubmit={submit}>
          <Text
            w="full"
            fontFamily="body"
            fontSize="sm"
            fontWeight="normal"
            lineHeight="sm"
            color="primary"
          >
            Введите код из письма
          </Text>
          <AuthField
            value={code}
            onChange={setCode}
            placeholder="Код"
            inputMode="numeric"
            autoComplete="one-time-code"
            invalid={showError}
            aria-label="Код из письма"
          />
          <AuthSubmit />
          <GoogleAuthButton onClick={signInGoogle} />
        </AuthForm>
      </AuthShell>
    </RedirectIfAuthed>
  )
}

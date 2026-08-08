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
import { ApiClientError } from '@/lib/api/client'
import {
  EMAIL_HINT,
  isValidEmail,
  isValidMockCode,
  loadPending,
  startEmailLogin,
  verifyEmailLogin,
} from '@/lib/storage/auth'

/** A0 — Email (+ error state Figma 320:1711 / 320:1734). Node 320:1635. */
export function AuthEmailPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [showError, setShowError] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const ok = isValidEmail(email)
    setShowError(!ok)
    return ok
  }

  const submit = async () => {
    if (!validate()) return
    setBusy(true)
    setSubmitError(null)
    try {
      await startEmailLogin(email)
      navigate('/auth/code', { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Не удалось отправить код. Запустите API и попробуйте снова.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <RedirectIfAuthed>
      <AuthShell>
        <AuthForm onSubmit={() => void submit()}>
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
            {submitError ? <AuthFieldError>{submitError}</AuthFieldError> : null}
          </Flex>
          <AuthSubmit disabled={busy} />
          <GoogleAuthButton
            onClick={() => setSubmitError('Вход через Google скоро будет доступен')}
          />
        </AuthForm>
      </AuthShell>
    </RedirectIfAuthed>
  )
}

/** A1 — Код из письма. Figma node 332:1521. После кода — сразу /plan. */
export function AuthCodePage() {
  const navigate = useNavigate()
  const pending = loadPending()
  const [code, setCode] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!pending) {
    return <Navigate to="/" replace />
  }

  const showError = touched && !isValidMockCode(code)

  const submit = async () => {
    setTouched(true)
    if (!isValidMockCode(code)) return
    setBusy(true)
    setSubmitError(null)
    try {
      await verifyEmailLogin(pending.email, code)
      navigate('/plan', { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : 'Не удалось войти. Проверьте код и API.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <RedirectIfAuthed>
      <AuthShell>
        <AuthForm onSubmit={() => void submit()}>
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
            invalid={showError || Boolean(submitError)}
            aria-label="Код из письма"
          />
          {submitError ? <AuthFieldError>{submitError}</AuthFieldError> : null}
          <AuthSubmit disabled={busy} />
          <GoogleAuthButton
            onClick={() => setSubmitError('Вход через Google скоро будет доступен')}
          />
        </AuthForm>
      </AuthShell>
    </RedirectIfAuthed>
  )
}

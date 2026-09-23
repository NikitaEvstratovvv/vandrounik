import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Flex, Text, chakra } from '@chakra-ui/react'
import {
  AuthField,
  AuthFieldError,
  AuthForm,
  AuthShell,
  AuthSubmit,
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

/** Dev-only: совпадает с DEV_TEST_EMAIL / DEV_LOGIN_CODE на сервере. */
const DEV_TEST_ACCOUNT = {
  email: 'test@vandrounik.local',
  code: '0000',
} as const

/** A0 — Email (+ error state Figma 320:1711 / 320:1734). Node 320:1635. */
export function AuthEmailPage() {
  const navigate = useNavigate()
  const pending = loadPending()
  const [email, setEmail] = useState(pending?.email ?? '')
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
        error instanceof ApiClientError ? error.message : 'Не удалось отправить код. Запусти API и попробуй снова.'
      setSubmitError(message)
    } finally {
      setBusy(false)
    }
  }

  const loginAsTest = async () => {
    setBusy(true)
    setSubmitError(null)
    try {
      await startEmailLogin(DEV_TEST_ACCOUNT.email)
      await verifyEmailLogin(DEV_TEST_ACCOUNT.email, DEV_TEST_ACCOUNT.code)
      navigate('/plan', { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : 'Тестовый вход не удался. Проверь DEV_TEST_EMAIL / DEV_LOGIN_CODE на API.'
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
          {import.meta.env.DEV ? (
            <chakra.button
              type="button"
              onClick={() => void loginAsTest()}
              disabled={busy}
              w="full"
              h="48px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="transparent"
              color="primary"
              fontFamily="body"
              fontSize="base"
              fontWeight="medium"
              lineHeight="base"
              borderRadius="card"
              cursor={busy ? 'default' : 'pointer'}
              opacity={busy ? 0.5 : 1}
              transition="opacity 150ms"
              _hover={busy ? undefined : { opacity: 0.75 }}
            >
              Тестовый вход
            </chakra.button>
          ) : null}
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
        error instanceof ApiClientError ? error.message : 'Не удалось войти. Проверь код и API.'
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
            overflowWrap="anywhere"
          >
            Отправили код на {pending.email}
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
          <chakra.button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            w="full"
            h="48px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="transparent"
            color="primary"
            fontFamily="body"
            fontSize="base"
            fontWeight="medium"
            lineHeight="base"
            borderRadius="card"
            cursor="pointer"
            transition="opacity 150ms"
            _hover={{ opacity: 0.75 }}
          >
            Изменить почту
          </chakra.button>
        </AuthForm>
      </AuthShell>
    </RedirectIfAuthed>
  )
}

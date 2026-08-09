import { Resend } from 'resend'
import { env } from '../env.js'

export async function sendLoginCode(
  email: string,
  code: string,
  purpose: 'login' | 'email_change' = 'login',
): Promise<void> {
  const label = purpose === 'email_change' ? 'email change' : 'login'
  if (!env.resendApiKey) {
    console.log(`[auth] ${label} code for ${email}: ${code}`)
    return
  }
  const subject =
    purpose === 'email_change' ? 'Код смены почты в Vandrounik' : 'Код входа в Vandrounik'
  const resend = new Resend(env.resendApiKey)
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: email,
    subject,
    text: `Ваш код: ${code}\n\nКод действует 10 минут.`,
  })
  if (error) {
    console.error('[auth] Resend error', error)
    throw new Error('Не удалось отправить письмо')
  }
}

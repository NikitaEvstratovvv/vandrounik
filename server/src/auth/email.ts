import { Resend } from 'resend'
import { env } from '../env.js'

export async function sendLoginCode(email: string, code: string): Promise<void> {
  if (!env.resendApiKey) {
    console.log(`[auth] login code for ${email}: ${code}`)
    return
  }
  const resend = new Resend(env.resendApiKey)
  const { error } = await resend.emails.send({
    from: env.emailFrom,
    to: email,
    subject: 'Код входа в Vandrounik',
    text: `Ваш код: ${code}\n\nКод действует 10 минут.`,
  })
  if (error) {
    console.error('[auth] Resend error', error)
    throw new Error('Не удалось отправить письмо')
  }
}

// app/forgot-password/actions.ts
"use server"

import prisma from "@/lib/prisma"
import { resend } from "@/lib/resend"
import { generateResetToken } from "@/lib/tokens"

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.mygamelist.app"

// Always returns the same generic message regardless of whether the email
// is registered, so this endpoint can't be used to enumerate accounts.
const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a password reset link."

export async function requestPasswordReset(
  prevState: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = formData.get("email") as string | null
  if (!email) return GENERIC_MESSAGE

  const user = await prisma.user.findUnique({ where: { email } })

  // Only issue a reset for accounts that actually have a password set.
  // OAuth-only accounts (no password field) have nothing to reset here.
  if (!user || !user.password) {
    return GENERIC_MESSAGE
  }

  const { rawToken, tokenHash } = generateResetToken()

  // Invalidate any previous outstanding tokens for this user before
  // issuing a new one.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } })

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  })

  const resetUrl = `${APP_URL}/reset-password/${rawToken}`

  await resend.emails.send({
    from: "MyGameList <noreply@mygamelist.app>",
    to: email,
    subject: "Reset your MyGameList password",
    html: `
      <p>Someone requested a password reset for your MyGameList account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `,
  })

  return GENERIC_MESSAGE
}

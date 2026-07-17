// app/reset-password/[token]/actions.ts
"use server"

import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { hashToken } from "@/lib/tokens"

export type ResetPasswordState = {
  error?: string
  success?: boolean
}

export async function resetPassword(
  prevState: ResetPasswordState | undefined,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = formData.get("token") as string | null
  const password = formData.get("password") as string | null
  const confirmPassword = formData.get("confirmPassword") as string | null

  if (!token || !password || !confirmPassword) {
    return { error: "Something went wrong. Please try the reset link again." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  if (password !== confirmPassword) {
    return { error: "Passwords don't match." }
  }

  const tokenHash = hashToken(token)

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return {
      error:
        "This reset link is invalid or has expired. Please request a new one.",
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  })

  // Invalidate all outstanding tokens for this user now that one's been used.
  await prisma.passwordResetToken.deleteMany({
    where: { userId: resetToken.userId },
  })

  return { success: true }
}

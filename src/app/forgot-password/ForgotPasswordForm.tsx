// app/forgot-password/ForgotPasswordForm.tsx
"use client"

import { useActionState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "./actions"

export default function ForgotPasswordForm() {
  const [message, formAction, isPending] = useActionState(
    requestPasswordReset,
    undefined,
  )

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form className="mt-8 space-y-6" action={formAction}>
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-md border-0 bg-white/5 backdrop-blur-md py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm sm:leading-6 px-3"
            placeholder="Email address"
          />
        </div>

        {message && (
          <div className="bg-white/5 border-l-4 border-purple-400 p-4 rounded-r-md">
            <p className="text-sm text-gray-200">{message}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </div>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-purple-400 hover:text-purple-300"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  )
}

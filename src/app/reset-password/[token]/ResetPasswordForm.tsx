// app/reset-password/[token]/ResetPasswordForm.tsx
"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { resetPassword } from "./actions"

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(
    resetPassword,
    undefined,
  )

  useEffect(() => {
    if (state?.success) {
      router.push("/login?reset=true")
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          Set a new password
        </h2>
      </div>

      <form className="mt-8 space-y-6" action={formAction}>
        <input type="hidden" name="token" value={token} />

        <div className="-space-y-px rounded-md">
          <div>
            <label htmlFor="password" className="sr-only">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="relative block w-full rounded-t-md border-0 bg-white/5 backdrop-blur-md py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm sm:leading-6 px-3"
              placeholder="New password"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="sr-only">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="relative block w-full rounded-b-md border-0 bg-white/5 backdrop-blur-md py-1.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm sm:leading-6 px-3"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        {state?.error && (
          <div className="bg-red-500/10 border-l-4 border-red-400 p-4 rounded-r-md">
            <p className="text-sm text-red-300">{state.error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex w-full justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </form>
    </div>
  )
}

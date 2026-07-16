// app/login/actions.ts
"use server"

import { signIn } from "@/auth" // adjust path if your auth.ts lives elsewhere
import { AuthError } from "next-auth"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid email or password"
        default:
          return "Something went wrong. Please try again."
      }
    }
    // next-auth throws a special redirect error internally on success —
    // it isn't an AuthError, so re-throw it or the redirect never completes.
    throw error
  }
}

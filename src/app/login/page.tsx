// app/login/page.tsx
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LoginForm from "./LoginForm"
import LoginSkeleton from "./LoginSkeleton"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

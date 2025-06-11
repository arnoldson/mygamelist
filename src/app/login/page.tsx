// app/login/page.tsx
import { Suspense } from "react"
import LoginForm from "./LoginForm"
import LoginSkeleton from "./LoginSkeleton"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoginSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

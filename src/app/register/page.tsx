// app/register/page.tsx
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import RegisterForm from "./RegisterForm"

export default async function RegisterPage() {
  const session = await auth()
  if (session?.user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  )
}

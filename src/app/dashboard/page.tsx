// app/dashboard/page.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SignOutButton from "./SignOutButton"

export default async function Dashboard() {
  const session = await auth()

  // Middleware already protects this route, but this is a safe fallback
  // in case the page is ever reached directly.
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mt-6">
          Welcome to your Dashboard, {session.user.name || "User"}!
        </h1>
        <p className="mt-3 text-xl">
          You are signed in as {session.user.email}
        </p>
        <SignOutButton />
      </main>
    </div>
  )
}

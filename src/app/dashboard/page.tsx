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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl sm:text-4xl font-bold mt-6 text-white break-words">
          Welcome to your Dashboard, {session.user.name || "User"}!
        </h1>
        <p className="mt-3 text-base sm:text-xl text-gray-300 break-words">
          You are signed in as {session.user.email}
        </p>
        <SignOutButton />
      </main>
    </div>
  )
}

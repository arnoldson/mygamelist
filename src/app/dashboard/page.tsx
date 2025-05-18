"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { signOut } from "next-auth/react"

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login")
    },
  })

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mt-6">
          Welcome to your Dashboard, {session?.user?.name || "User"}!
        </h1>
        <p className="mt-3 text-xl">
          You are signed in as {session?.user?.email}
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-8 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Sign Out
        </button>
      </main>
    </div>
  )
}

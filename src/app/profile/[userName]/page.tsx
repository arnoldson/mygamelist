// app/profile/[userName]/page.tsx
import { Suspense } from "react"
import ProfileContent from "./ProfileContent"
import ProfileSkeleton from "./ProfileSkeleton"

interface PageProps {
  params: Promise<{
    userName: string
  }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { userName } = await params

  // ProfileContent and ProfileSkeleton each own their full-page dark
  // background and max-w-6xl container, so this page just wires up
  // routing and gets out of the way.
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent userName={userName} />
    </Suspense>
  )
}

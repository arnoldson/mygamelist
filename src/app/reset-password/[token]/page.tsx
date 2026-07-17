// app/reset-password/[token]/page.tsx
import ResetPasswordForm from "./ResetPasswordForm"

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <ResetPasswordForm token={token} />
    </div>
  )
}

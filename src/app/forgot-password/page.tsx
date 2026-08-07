// app/forgot-password/page.tsx
import ForgotPasswordForm from "./ForgotPasswordForm"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-black py-12 px-4 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  )
}

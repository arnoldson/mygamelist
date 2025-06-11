// app/login/LoginSkeleton.tsx
export default function LoginSkeleton() {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>

      <div className="space-y-6">
        <div className="-space-y-px rounded-md shadow-sm">
          <div className="h-10 bg-gray-200 rounded-t-md"></div>
          <div className="h-10 bg-gray-200 rounded-b-md"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>

        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  )
}

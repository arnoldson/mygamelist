// app/profile/[userName]/ProfileSkeleton.tsx
export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white/10 rounded-full mb-4"></div>
                <div className="h-6 bg-white/10 rounded w-32 mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
                <div className="h-16 bg-white/10 rounded w-full mb-4"></div>
                <div className="h-10 bg-white/10 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 animate-pulse"
              >
                <div className="h-6 bg-white/10 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="text-center">
                      <div className="h-8 bg-white/10 rounded w-16 mx-auto mb-2"></div>
                      <div className="h-4 bg-white/10 rounded w-20 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

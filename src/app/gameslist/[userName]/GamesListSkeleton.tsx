// app/gameslist/[userName]/GamesListSkeleton.tsx
export default function GamesListSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-white/10 rounded w-64"></div>
              <div className="h-5 bg-white/10 rounded w-80"></div>
            </div>
          </div>
        </div>

        {/* Filter skeleton */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm p-6">
          <div className="h-6 bg-white/10 rounded w-40 mb-4"></div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-9 bg-white/10 rounded-full w-28"></div>
            ))}
          </div>
        </div>

        {/* Games grid skeleton */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg shadow-sm">
          <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4">
            <div className="h-6 bg-white/10 rounded w-48"></div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-white/[0.03] rounded-lg p-4"
                >
                  <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-white/10 rounded"></div>
                    <div className="h-4 bg-white/10 rounded w-2/3"></div>
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

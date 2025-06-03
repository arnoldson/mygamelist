// app/gameslist/[userName]/GamesListSkeleton.tsx
export default function GamesListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-300 rounded w-64"></div>
            <div className="h-5 bg-gray-300 rounded w-80"></div>
          </div>
        </div>
      </div>

      {/* Filter skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 bg-gray-300 rounded-full w-28"></div>
          ))}
        </div>
      </div>

      {/* Games grid skeleton */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="bg-gray-100 border-b px-6 py-4">
          <div className="h-6 bg-gray-300 rounded w-48"></div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

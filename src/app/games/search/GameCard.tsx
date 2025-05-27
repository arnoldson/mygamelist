import Image from "next/image"
import { Star, Calendar, GamepadIcon } from "lucide-react"
import type { Game } from "@/types/game"

interface GameCardProps {
  game: Game
}

export default function GameCard({ game }: GameCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return "TBA"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getPlatformNames = (platforms: Game["platforms"]) => {
    return platforms
      .slice(0, 3)
      .map((p) => p.platform.name)
      .join(", ")
  }

  return (
    <div
      data-testid="game-card"
      className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105"
    >
      {/* Game Image */}
      <div className="relative h-48 bg-gray-800">
        {game.background_image ? (
          <Image
            src={game.background_image}
            alt={game.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <GamepadIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}
        {game.metacritic && (
          <div className="absolute top-3 right-3">
            <div
              className={`px-2 py-1 rounded text-xs font-bold ${
                game.metacritic >= 75
                  ? "bg-green-600"
                  : game.metacritic >= 50
                  ? "bg-yellow-600"
                  : "bg-red-600"
              } text-white`}
            >
              {game.metacritic}
            </div>
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
          {game.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-2" data-testid="rating">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white font-medium">
              {game.rating.toFixed(1)}
            </span>
          </div>
          <span className="text-gray-400 text-sm">
            ({game.ratings_count.toLocaleString()} reviews)
          </span>
        </div>

        {/* Release Date */}
        <div
          className="flex items-center gap-2 mb-2"
          data-testid="release-date"
        >
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-gray-300 text-sm">
            {formatDate(game.released)}
          </span>
        </div>

        {/* Platforms */}
        {game.platforms && game.platforms.length > 0 && (
          <div className="mb-3">
            <p className="text-gray-400 text-sm mb-1">Platforms:</p>
            <p className="text-gray-300 text-sm">
              {getPlatformNames(game.platforms)}
              {game.platforms.length > 3 &&
                ` +${game.platforms.length - 3} more`}
            </p>
          </div>
        )}

        {/* Genres */}
        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1" data-testid="genres">
            {game.genres.slice(0, 3).map((genre) => (
              <span
                key={genre.id}
                className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full"
              >
                {genre.name}
              </span>
            ))}
            {game.genres.length > 3 && (
              <span className="px-2 py-1 bg-gray-600/30 text-gray-300 text-xs rounded-full">
                +{game.genres.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

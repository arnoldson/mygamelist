import Image from "next/image"
import { Star, Calendar, GamepadIcon, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import type { Game } from "@/types/game"
import { GameListType } from "@/types/enums"

interface GameCardProps {
  game: Game & { status?: number } // Add optional status property
  onAddGame?: (game: Game) => void
  showAddButton?: boolean
}

export default function GameCard({
  game,
  onAddGame,
  showAddButton = false,
}: GameCardProps) {
  const { data: session } = useSession()

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

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddGame) {
      onAddGame(game)
    }
  }

  const getStatusBadge = () => {
    if (!game.status) return null

    const statusConfig = {
      [GameListType.PLAYING]: {
        label: "Playing",
        bgColor: "bg-green-500",
        textColor: "text-white",
      },
      [GameListType.COMPLETED]: {
        label: "Completed",
        bgColor: "bg-blue-500",
        textColor: "text-white",
      },
      [GameListType.ON_HOLD]: {
        label: "On Hold",
        bgColor: "bg-yellow-500",
        textColor: "text-black",
      },
      [GameListType.DROPPED]: {
        label: "Dropped",
        bgColor: "bg-red-500",
        textColor: "text-white",
      },
      [GameListType.PLAN_TO_PLAY]: {
        label: "Plan to Play",
        bgColor: "bg-purple-500",
        textColor: "text-white",
      },
    }

    const config = statusConfig[game.status as GameListType]
    if (!config) return null

    return (
      <div className="absolute top-3 right-3 z-10">
        <span
          className={`
          px-2 py-1 rounded-full text-xs font-semibold shadow-lg
          ${config.bgColor} ${config.textColor}
        `}
        >
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div
      data-testid="game-card"
      className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105 relative group"
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

        {/* Metacritic Score - Always in top left */}
        {game.metacritic && (
          <div className="absolute top-3 left-3">
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

        {/* Status Badge - Top right when present */}
        {getStatusBadge()}

        {/* Add Button - Only show if game is not in user's list */}
        {showAddButton && !game.status && (
          <div className="absolute top-3 right-3">
            {session?.user ? (
              <button
                onClick={handleAddClick}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                title="Add to your list"
              >
                <Plus className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleAddClick}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs font-medium"
                title="Sign in to add to list"
              >
                Sign in
              </button>
            )}
          </div>
        )}

        {/* Overlay for non-authenticated users - Only show if game is not in list */}
        {showAddButton && !session?.user && !game.status && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-t-xl flex items-center justify-center">
            <button
              onClick={handleAddClick}
              className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-lg"
            >
              Sign in to Add
            </button>
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

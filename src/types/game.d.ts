// types/game.ts
export interface Game {
  id: number
  name: string
  slug: string
  released: string
  background_image: string
  rating: number
  rating_top: number
  ratings_count: number
  metacritic: number
  playtime: number
  genres: Genre[]
  platforms: GamePlatform[]
}

export interface Genre {
  id: number
  name: string
  slug: string
}

export interface Platform {
  id: number
  name: string
  slug: string
}

export interface GamePlatform {
  platform: Platform
  released_at: string
}

export interface RAWGSearchResponse {
  count: number
  next: string | null
  previous: string | null
  results: Game[]
}

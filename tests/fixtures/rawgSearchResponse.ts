// tests/fixtures/rawgSearchResponse.ts
//
// Shared mock RAWG API response, built to match the real Game/
// RAWGSearchResponse shape from src/types/game.d.ts. Used by both
// games-search.spec.ts and responsive.spec.ts so tests don't depend on
// RAWG's actual uptime or response latency. The game's name deliberately
// contains "Zelda" so it satisfies existing assertions that check the
// search term appears in the result.
export const MOCK_SEARCH_RESPONSE = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 22511,
      name: "The Legend of Zelda: Breath of the Wild",
      slug: "the-legend-of-zelda-breath-of-the-wild",
      released: "2017-03-03",
      // Deliberately empty so GameCard renders its fallback icon instead
      // of attempting to load a real image from an external host.
      background_image: "",
      rating: 4.5,
      rating_top: 5,
      ratings_count: 1234,
      metacritic: 97,
      playtime: 50,
      genres: [
        { id: 4, name: "Action", slug: "action" },
        { id: 3, name: "Adventure", slug: "adventure" },
      ],
      platforms: [
        {
          platform: { id: 7, name: "Nintendo Switch", slug: "switch" },
          released_at: "2017-03-03",
        },
      ],
    },
  ],
}

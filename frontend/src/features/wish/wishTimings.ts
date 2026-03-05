export const WISH_TIMINGS = {
  requestingMinMs: 500,
  introMsByRarity: {
    3: 900,
    4: 1300,
    5: 1800
  },
  revealStartDelayMs: 180,
  revealStaggerMs: 230,
  summaryDelayMs: 240
} as const;

export type WishRarity = 3 | 4 | 5;

export function introDurationForRarity(rarity: WishRarity): number {
  return WISH_TIMINGS.introMsByRarity[rarity];
}

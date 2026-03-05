import type { WishRarity } from "./wishTimings";

type SfxKey = "pullStart" | "rarity3" | "rarity4" | "rarity5" | "cardFlip" | "summaryOpen";

const introVideoByRarity: Record<WishRarity, string> = {
  3: "/wish/video/intro-3.mp4",
  4: "/wish/video/intro-4.mp4",
  5: "/wish/video/intro-5.mp4"
};

const fallbackPortraitByRarity: Record<WishRarity, string> = {
  3: "/wish/art/cards/fallback-3.webp",
  4: "/wish/art/cards/fallback-4.webp",
  5: "/wish/art/cards/fallback-5.webp"
};

const itemPortraitById: Record<string, string> = {
  arlecchino: "/wish/art/cards/arlecchino.webp",
  diluc: "/wish/art/cards/diluc.webp",
  keqing: "/wish/art/cards/keqing.webp",
  fischl: "/wish/art/cards/fischl.webp",
  xiangling: "/wish/art/cards/xiangling.webp",
  bennett: "/wish/art/cards/bennett.webp",
  "debate-club": "/wish/art/cards/debate-club.webp",
  slingshot: "/wish/art/cards/slingshot.webp",
  "harbinger-of-dawn": "/wish/art/cards/harbinger-of-dawn.webp"
};

const sfxByKey: Record<SfxKey, string> = {
  pullStart: "/wish/sfx/pull-start.mp3",
  rarity3: "/wish/sfx/rarity-3.mp3",
  rarity4: "/wish/sfx/rarity-4.mp3",
  rarity5: "/wish/sfx/rarity-5.mp3",
  cardFlip: "/wish/sfx/card-flip.mp3",
  summaryOpen: "/wish/sfx/summary-open.mp3"
};

export function getIntroVideoForRarity(rarity: WishRarity): string {
  return introVideoByRarity[rarity];
}

export function getSfxPath(key: SfxKey): string {
  return sfxByKey[key];
}

export function getItemPortrait(itemId: string, rarity: WishRarity): string {
  return itemPortraitById[itemId] ?? fallbackPortraitByRarity[rarity];
}

export function preloadWishAssets(): void {
  const imageAssets = [...Object.values(itemPortraitById), ...Object.values(fallbackPortraitByRarity)];
  for (const url of imageAssets) {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }

  for (const url of Object.values(introVideoByRarity)) {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
  }

  for (const url of Object.values(sfxByKey)) {
    const audio = document.createElement("audio");
    audio.preload = "auto";
    audio.src = url;
  }
}

export type { SfxKey };

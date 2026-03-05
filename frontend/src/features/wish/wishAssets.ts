import type { WishRarity } from "./wishTimings";

type SfxKey = "pullStart" | "rarity3" | "rarity4" | "rarity5" | "cardFlip" | "summaryOpen";

function rarityFallbackDataUri(rarity: WishRarity): string {
  const palette =
    rarity === 5
      ? { top: "#2a1f0a", bottom: "#8b6f2f", border: "#e3c56f", text: "#f8e8b5" }
      : rarity === 4
        ? { top: "#1f1835", bottom: "#5d46a6", border: "#b7a3ff", text: "#e2d8ff" }
        : { top: "#15171f", bottom: "#37415b", border: "#93a1c7", text: "#d8e0f6" };

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <linearGradient id="bg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${palette.top}"/>
      <stop offset="100%" stop-color="${palette.bottom}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#bg)"/>
  <rect x="26" y="26" width="668" height="1228" rx="28" fill="none" stroke="${palette.border}" stroke-width="3"/>
  <text x="50%" y="47%" dominant-baseline="middle" text-anchor="middle" fill="${palette.text}" font-size="96" font-family="Inter, sans-serif" font-weight="700">${rarity}★ Reward</text>
  <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="${palette.text}" opacity="0.86" font-size="40" font-family="Inter, sans-serif">Arlecchino Academy Wish</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const introVideoByRarity: Record<WishRarity, string> = {
  3: "/wish/video/intro-3.mp4",
  4: "/wish/video/intro-4.mp4",
  5: "/wish/video/intro-5.mp4"
};

const fallbackPortraitByRarity: Record<WishRarity, string> = {
  3: rarityFallbackDataUri(3),
  4: rarityFallbackDataUri(4),
  5: rarityFallbackDataUri(5)
};

const itemPortraitById: Record<string, string> = {
  // User-provided Pinterest reference image, backed by pinimg CDN.
  arlecchino: "https://i.pinimg.com/736x/90/d5/02/90d5026ae3e65f59e9c7277836cc0619.jpg"
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

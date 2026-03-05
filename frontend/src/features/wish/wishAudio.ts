import { Howl, Howler } from "howler";
import { getSfxPath, type SfxKey } from "./wishAssets";

let sounds: Partial<Record<SfxKey, Howl>> = {};

function ensureSounds(): void {
  if (Object.keys(sounds).length > 0) {
    return;
  }
  sounds = {
    pullStart: new Howl({ src: [getSfxPath("pullStart")], volume: 0.45 }),
    rarity3: new Howl({ src: [getSfxPath("rarity3")], volume: 0.55 }),
    rarity4: new Howl({ src: [getSfxPath("rarity4")], volume: 0.58 }),
    rarity5: new Howl({ src: [getSfxPath("rarity5")], volume: 0.62 }),
    cardFlip: new Howl({ src: [getSfxPath("cardFlip")], volume: 0.4 }),
    summaryOpen: new Howl({ src: [getSfxPath("summaryOpen")], volume: 0.5 })
  };
}

export function unlockWishAudio(): void {
  ensureSounds();
  void Howler.ctx?.resume();
}

export function playWishSfx(key: SfxKey): void {
  ensureSounds();
  const sound = sounds[key];
  if (!sound) {
    return;
  }
  sound.play();
}

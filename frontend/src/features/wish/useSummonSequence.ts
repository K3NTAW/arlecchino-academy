import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { GachaPullResult } from "@academy/shared";
import { playWishSfx } from "./wishAudio";
import { WISH_TIMINGS, introDurationForRarity, type WishRarity } from "./wishTimings";

export type SummonPhase = "idle" | "requesting" | "cinematicIntro" | "revealCards" | "summary";

type TimerHandle = ReturnType<typeof setTimeout>;

function highestRarityFromPulls(pulls: GachaPullResult[]): WishRarity {
  return pulls.reduce<WishRarity>((maxRarity, pull) => {
    if (pull.item.rarity > maxRarity) {
      return pull.item.rarity;
    }
    return maxRarity;
  }, 3);
}

export function useSummonSequence() {
  const prefersReducedMotion = useReducedMotion();
  const timers = useRef<TimerHandle[]>([]);

  const [phase, setPhase] = useState<SummonPhase>("idle");
  const [pulls, setPulls] = useState<GachaPullResult[]>([]);
  const [highestRarity, setHighestRarity] = useState<WishRarity>(3);
  const [revealedCount, setRevealedCount] = useState(0);
  const [lastPullCount, setLastPullCount] = useState<1 | 10>(1);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const toIdle = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setPulls([]);
    setRevealedCount(0);
  }, [clearTimers]);

  const startRequest = useCallback(
    (count: 1 | 10) => {
      clearTimers();
      setLastPullCount(count);
      setPhase("requesting");
      setRevealedCount(0);
    },
    [clearTimers]
  );

  const startSequence = useCallback(
    (nextPulls: GachaPullResult[]) => {
      clearTimers();
      const rarity = highestRarityFromPulls(nextPulls);
      setPulls(nextPulls);
      setHighestRarity(rarity);
      setRevealedCount(0);

      if (prefersReducedMotion) {
        setRevealedCount(nextPulls.length);
        setPhase("summary");
        playWishSfx("summaryOpen");
        return;
      }

      setPhase("cinematicIntro");
      playWishSfx(rarity === 5 ? "rarity5" : rarity === 4 ? "rarity4" : "rarity3");

      const introDelay = Math.max(introDurationForRarity(rarity), WISH_TIMINGS.requestingMinMs);
      timers.current.push(
        setTimeout(() => {
          setPhase("revealCards");
        }, introDelay)
      );

      for (let index = 0; index < nextPulls.length; index += 1) {
        const revealAt = introDelay + WISH_TIMINGS.revealStartDelayMs + index * WISH_TIMINGS.revealStaggerMs;
        timers.current.push(
          setTimeout(() => {
            setRevealedCount(index + 1);
            playWishSfx("cardFlip");
          }, revealAt)
        );
      }

      const summaryAt =
        introDelay +
        WISH_TIMINGS.revealStartDelayMs +
        nextPulls.length * WISH_TIMINGS.revealStaggerMs +
        WISH_TIMINGS.summaryDelayMs;
      timers.current.push(
        setTimeout(() => {
          setPhase("summary");
          playWishSfx("summaryOpen");
        }, summaryAt)
      );
    },
    [clearTimers, prefersReducedMotion]
  );

  const skipToSummary = useCallback(() => {
    if (phase === "idle" || phase === "summary" || pulls.length === 0) {
      return;
    }
    clearTimers();
    setRevealedCount(pulls.length);
    setPhase("summary");
    playWishSfx("summaryOpen");
  }, [clearTimers, phase, pulls]);

  const isBusy = phase !== "idle";
  const canStartPull = phase === "idle";
  const canSkip = phase === "cinematicIntro" || phase === "revealCards";

  return useMemo(
    () => ({
      phase,
      pulls,
      highestRarity,
      revealedCount,
      lastPullCount,
      isBusy,
      canStartPull,
      canSkip,
      startRequest,
      startSequence,
      skipToSummary,
      toIdle
    }),
    [
      canSkip,
      canStartPull,
      highestRarity,
      isBusy,
      lastPullCount,
      phase,
      pulls,
      revealedCount,
      skipToSummary,
      startRequest,
      startSequence,
      toIdle
    ]
  );
}

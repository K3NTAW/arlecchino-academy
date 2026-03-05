import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { GachaPullResult } from "@academy/shared";
import { CardRevealTrack } from "./CardRevealTrack";
import { RarityBurst } from "./RarityBurst";
import { ResultSummary } from "./ResultSummary";
import { getIntroVideoForRarity } from "./wishAssets";
import type { SummonPhase } from "./useSummonSequence";

export function SummonOverlay({
  phase,
  pulls,
  highestRarity,
  revealedCount,
  canSkip,
  canPullAgain,
  onSkip,
  onClose,
  onPullAgain
}: {
  phase: SummonPhase;
  pulls: GachaPullResult[];
  highestRarity: 3 | 4 | 5;
  revealedCount: number;
  canSkip: boolean;
  canPullAgain: boolean;
  onSkip: () => void;
  onClose: () => void;
  onPullAgain: () => void;
}) {
  const active = phase !== "idle";
  if (!active) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className={`wish-overlay phase-${phase} rarity-${highestRarity}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="wish-overlay-bg" />
        <video className="wish-overlay-video" src={getIntroVideoForRarity(highestRarity)} autoPlay muted playsInline />

        {canSkip ? (
          <button type="button" className="wish-overlay-skip" onClick={onSkip}>
            Skip
          </button>
        ) : null}

        {phase === "requesting" ? (
          <motion.div className="wish-overlay-center" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Sparkles size={22} />
            <h3>Opening Wish Portal...</h3>
            <p>Calculating fate and pity guarantees.</p>
          </motion.div>
        ) : null}

        {phase === "cinematicIntro" ? (
          <div className="wish-overlay-center">
            <RarityBurst rarity={highestRarity} />
          </div>
        ) : null}

        {phase === "revealCards" ? (
          <div className="wish-overlay-reveal">
            <RarityBurst rarity={highestRarity} />
            <CardRevealTrack pulls={pulls} revealedCount={revealedCount} />
          </div>
        ) : null}

        {phase === "summary" ? (
          <motion.div
            className="wish-overlay-summary"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <ResultSummary pulls={pulls} canPullAgain={canPullAgain} onClose={onClose} onPullAgain={onPullAgain} />
          </motion.div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

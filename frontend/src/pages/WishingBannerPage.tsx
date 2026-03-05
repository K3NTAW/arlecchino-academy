import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GachaPullResult } from "@academy/shared";
import { fetchGachaState, performGachaPull } from "../lib/api";
import { useAppStore } from "../store/appStore";
import { preloadWishAssets } from "../features/wish/wishAssets";
import { playWishSfx, unlockWishAudio } from "../features/wish/wishAudio";
import { SummonOverlay } from "../features/wish/SummonOverlay";
import { useSummonSequence } from "../features/wish/useSummonSequence";
import { getItemPortrait } from "../features/wish/wishAssets";

type PullButtonCount = 1 | 10;

export function WishingBannerPage() {
  const token = useAppStore((state) => state.token);
  const gachaState = useAppStore((state) => state.gachaState);
  const setGachaState = useAppStore((state) => state.setGachaState);
  const applyGachaPull = useAppStore((state) => state.applyGachaPull);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [lastPulls, setLastPulls] = useState<GachaPullResult[]>([]);
  const summon = useSummonSequence();

  useEffect(() => {
    preloadWishAssets();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    void fetchGachaState(token, controller.signal)
      .then((nextState) => {
        setGachaState(nextState);
        setStatus("ready");
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return;
        }
        setStatus("error");
        setError(loadError instanceof Error ? loadError.message : "Failed to load banner.");
      });
    return () => controller.abort();
  }, [setGachaState, token]);

  const canPull = useMemo(
    () => (count: PullButtonCount) => {
      if (!gachaState || isPulling || !summon.canStartPull) {
        return false;
      }
      return gachaState.currency >= gachaState.banner.costPerPull * count;
    },
    [gachaState, isPulling, summon.canStartPull]
  );

  const handlePull = async (count: PullButtonCount) => {
    if (!token || !gachaState || !summon.canStartPull) {
      return;
    }
    summon.startRequest(count);
    unlockWishAudio();
    playWishSfx("pullStart");
    setIsPulling(true);
    setError(null);
    try {
      const result = await performGachaPull({ token, count });
      applyGachaPull(result);
      setLastPulls(result.pulls);
      summon.startSequence(result.pulls);
    } catch (pullError) {
      summon.toIdle();
      setError(pullError instanceof Error ? pullError.message : "Pull failed.");
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <motion.section
      className="wish-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {status === "loading" ? <p className="wish-status">Loading banner state...</p> : null}
      {status === "error" ? <p className="wish-status wish-error">{error ?? "Failed to load banner."}</p> : null}
      {status === "ready" && gachaState ? (
        <>
          <section className="wish-top-rail">
            <div className="wish-top-tabs">
              <button type="button" className="is-active">
                Character Event Wish
              </button>
              <button type="button">Epitome Invocation</button>
              <button type="button">Standard Wish</button>
            </div>
            <div className="wish-top-currency">
              <span>
                <Star size={14} />
                Ember Coins {gachaState.currency.toLocaleString("en-US")}
              </span>
              <span>
                <Sparkles size={14} />
                Intertwined Fate 0
              </span>
            </div>
          </section>

          <section className="wish-banner-stage">
            <article className="wish-banner-main">
              <div className="wish-banner-copy">
                <small>Character Event Wish</small>
                <h1>The Hearth&apos;s Ashen Shadow</h1>
                <p className="wish-banner-rate-line">
                  Probability increased. Every 10 wishes guarantees at least one 4-star or higher item.
                </p>
                <p>
                  5-star event-exclusive characters are only available during this banner period. Spend Ember Coins
                  to call Arlecchino.
                </p>
                <div className="wish-banner-pity-row">
                  <span>4★ pity {gachaState.pity4Counter + 1}/10</span>
                  <span>5★ pity {gachaState.pity5Counter + 1}/90</span>
                  <span>{gachaState.guaranteedFeatured5Star ? "Featured guaranteed next 5★" : "50/50 active"}</span>
                </div>
              </div>

              <div className="wish-banner-art">
                <img src={getItemPortrait("arlecchino", 5)} alt="Arlecchino featured banner art" loading="eager" />
                <div className="wish-banner-art-overlay">
                  <strong>Arlecchino</strong>
                  <span>Dire Balemoon</span>
                </div>
              </div>
            </article>

            <footer className="wish-action-bar">
              <div className="wish-action-meta">
                <button type="button">Shop</button>
                <button type="button">Details</button>
                <button type="button">History</button>
              </div>
              <div className="wish-pull-actions">
                <button type="button" disabled={!canPull(1)} onClick={() => void handlePull(1)}>
                  Wish x1 <small>{gachaState.banner.costPerPull}</small>
                </button>
                <button type="button" disabled={!canPull(10)} onClick={() => void handlePull(10)}>
                  Wish x10 <small>{gachaState.banner.costPerPull * 10}</small>
                </button>
              </div>
            </footer>
          </section>

          {error ? <p className="wish-status wish-error">{error}</p> : null}

          {lastPulls.length > 0 ? (
            <section className="wish-results">
              <h3>Latest Pull Results</h3>
              <div className="wish-results-grid">
                {lastPulls.map((pull, index) => (
                  <article key={`${pull.item.id}-${index}`} className={`wish-result-item rarity-${pull.item.rarity}`}>
                    <div>
                      <Star size={14} />
                      <span>{pull.item.rarity}★</span>
                    </div>
                    <strong>{pull.item.name}</strong>
                    <small>
                      {pull.wasPity5
                        ? "5★ pity"
                        : pull.wasPity4
                          ? "4★ pity"
                          : pull.wasFeaturedGuarantee
                            ? "featured guarantee"
                            : "standard roll"}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="wish-history">
            <h3>Pull History</h3>
            {gachaState.history.length === 0 ? (
              <p>No pulls yet. Make your first wish.</p>
            ) : (
              <div className="wish-history-list">
                {gachaState.history.map((pull, index) => (
                  <div key={`${pull.item.id}-${index}`} className="wish-history-row">
                    <span className={`wish-rarity-tag rarity-${pull.item.rarity}`}>{pull.item.rarity}★</span>
                    <strong>{pull.item.name}</strong>
                    <small>
                      {pull.wasFeaturedGuarantee
                        ? "featured guarantee"
                        : pull.wasPity5
                          ? "5★ pity"
                          : pull.wasPity4
                            ? "4★ pity"
                            : "roll"}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
      <SummonOverlay
        phase={summon.phase}
        pulls={summon.pulls}
        highestRarity={summon.highestRarity}
        revealedCount={summon.revealedCount}
        canSkip={summon.canSkip}
        canPullAgain={Boolean(gachaState && canPull(summon.lastPullCount))}
        onSkip={summon.skipToSummary}
        onClose={summon.toIdle}
        onPullAgain={() => void handlePull(summon.lastPullCount)}
      />
    </motion.section>
  );
}

import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { GachaPullResult } from "@academy/shared";
import { fetchGachaState, performGachaPull } from "../lib/api";
import { useAppStore } from "../store/appStore";

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
      if (!gachaState || isPulling) {
        return false;
      }
      return gachaState.currency >= gachaState.banner.costPerPull * count;
    },
    [gachaState, isPulling]
  );

  const handlePull = async (count: PullButtonCount) => {
    if (!token || !gachaState) {
      return;
    }
    setIsPulling(true);
    setError(null);
    try {
      const result = await performGachaPull({ token, count });
      applyGachaPull(result);
      setLastPulls(result.pulls);
    } catch (pullError) {
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
      <div className="wish-hero-card">
        <small>Event Wish</small>
        <h1>Moment of Crimson Oath</h1>
        <p>Spend Ember Coins to pull for Arlecchino. Pity and guarantee are persisted to your profile.</p>
        <div className="wish-featured">
          <Sparkles size={16} />
          <span>Featured 5★: Arlecchino</span>
        </div>
      </div>

      {status === "loading" ? <p className="wish-status">Loading banner state...</p> : null}
      {status === "error" ? <p className="wish-status wish-error">{error ?? "Failed to load banner."}</p> : null}
      {status === "ready" && gachaState ? (
        <>
          <section className="wish-state-grid">
            <article className="wish-state-card">
              <h2>Ember Coins</h2>
              <strong>{gachaState.currency.toLocaleString("en-US")}</strong>
            </article>
            <article className="wish-state-card">
              <h2>4★ Pity</h2>
              <strong>
                {gachaState.pity4Counter} / {gachaState.banner.pity4}
              </strong>
            </article>
            <article className="wish-state-card">
              <h2>5★ Pity</h2>
              <strong>
                {gachaState.pity5Counter} / {gachaState.banner.pity5}
              </strong>
            </article>
            <article className="wish-state-card">
              <h2>Featured Guarantee</h2>
              <strong>{gachaState.guaranteedFeatured5Star ? "Ready" : "Not Active"}</strong>
            </article>
          </section>

          <div className="wish-pull-actions">
            <button type="button" disabled={!canPull(1)} onClick={() => void handlePull(1)}>
              Pull x1 ({gachaState.banner.costPerPull})
            </button>
            <button type="button" disabled={!canPull(10)} onClick={() => void handlePull(10)}>
              Pull x10 ({gachaState.banner.costPerPull * 10})
            </button>
          </div>
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
    </motion.section>
  );
}

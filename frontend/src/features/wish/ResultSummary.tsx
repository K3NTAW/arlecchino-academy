import { Star } from "lucide-react";
import type { GachaPullResult } from "@academy/shared";
import { getItemPortrait } from "./wishAssets";

export function ResultSummary({
  pulls,
  canPullAgain,
  onClose,
  onPullAgain
}: {
  pulls: GachaPullResult[];
  canPullAgain: boolean;
  onClose: () => void;
  onPullAgain: () => void;
}) {
  return (
    <div className="wish-summary-panel">
      <header>
        <small>Summon Complete</small>
        <h3>Results</h3>
      </header>
      <div className="wish-summary-grid">
        {pulls.map((pull, index) => (
          <article key={`${pull.item.id}-${index}`} className={`wish-summary-item rarity-${pull.item.rarity}`}>
            <img src={getItemPortrait(pull.item.id, pull.item.rarity)} alt={pull.item.name} loading="lazy" />
            <div>
              <span>
                <Star size={12} />
                {pull.item.rarity}★
              </span>
              <strong>{pull.item.name}</strong>
            </div>
          </article>
        ))}
      </div>
      <footer className="wish-summary-actions">
        <button type="button" onClick={onClose}>
          Continue
        </button>
        <button type="button" onClick={onPullAgain} disabled={!canPullAgain}>
          Pull Again
        </button>
      </footer>
    </div>
  );
}

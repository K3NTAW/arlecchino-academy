import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { GachaPullResult } from "@academy/shared";
import { getItemPortrait } from "./wishAssets";

export function CardRevealTrack({
  pulls,
  revealedCount
}: {
  pulls: GachaPullResult[];
  revealedCount: number;
}) {
  return (
    <div className="wish-reveal-track">
      {pulls.map((pull, index) => {
        const visible = index < revealedCount;
        return (
          <motion.article
            key={`${pull.item.id}-${index}`}
            className={`wish-reveal-card rarity-${pull.item.rarity} ${visible ? "is-visible" : ""}`}
            initial={false}
            animate={{
              opacity: visible ? 1 : 0.2,
              rotateY: visible ? 0 : -90,
              y: visible ? 0 : 10
            }}
            transition={{ duration: 0.26, ease: "easeOut" }}
          >
            <div className="wish-reveal-card-art-wrap">
              <img
                className="wish-reveal-card-art"
                src={getItemPortrait(pull.item.id, pull.item.rarity)}
                alt={pull.item.name}
                loading="eager"
              />
            </div>
            <div className="wish-reveal-card-meta">
              <div>
                <Star size={13} />
                <span>{pull.item.rarity}★</span>
              </div>
              <strong>{pull.item.name}</strong>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

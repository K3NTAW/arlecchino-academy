import { motion } from "framer-motion";

export function RarityBurst({ rarity }: { rarity: 3 | 4 | 5 }) {
  return (
    <motion.div
      className={`wish-rarity-burst rarity-${rarity}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <motion.div
        className="wish-rarity-burst-ring"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
      <motion.strong initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        {rarity}★ Rarity
      </motion.strong>
    </motion.div>
  );
}

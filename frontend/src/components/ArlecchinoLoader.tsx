import { motion } from "framer-motion";

export function ArlecchinoLoader({ message }: { message: string }) {
  return (
    <div className="director-overlay" role="status" aria-live="polite">
      <motion.div
        className="director-sigil"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ rotate: { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }, scale: { duration: 2.2, repeat: Number.POSITIVE_INFINITY } }}
      >
        ✦
      </motion.div>
      <p className="director-text">{message}</p>
      <p className="director-subtext">Generating lesson and challenges. This may take a moment.</p>
    </div>
  );
}

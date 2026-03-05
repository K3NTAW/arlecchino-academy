import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { loginContract } from "../lib/api";
import { useAppStore } from "../store/appStore";

export function LoginPage() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAppStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const nextPath = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginContract();
      setSubmitted(true);
      setSession({ name: name.trim(), token: response.token });
      window.setTimeout(() => {
        navigate(nextPath, { replace: true });
      }, 260);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Failed to login.");
      setSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`contract-page ${submitted ? "contract-submitted" : ""}`}>
      <div className="vignette-overlay" />
      <motion.div
        className="contract-sigil"
        animate={{ rotate: 360, scale: [1, 1.06, 1] }}
        transition={{ rotate: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }, scale: { duration: 2, repeat: Number.POSITIVE_INFINITY } }}
      >
        ✦
      </motion.div>
      <motion.form
        className="contract-card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.35 }}
        onSubmit={onSubmit}
      >
        <h1>House of the Hearth</h1>
        <p>Enter your name to begin your contract.</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name, child."
          aria-label="Name"
        />
        {error ? <p className="inline-error">{error}</p> : null}
        <button type="submit" disabled={isLoading || name.trim().length < 2}>
          {isLoading ? "Signing..." : "Sign the Contract"}
        </button>
      </motion.form>
    </div>
  );
}

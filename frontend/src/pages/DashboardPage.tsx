import {
  BarChart3,
  Check,
  FileUp,
  Flame,
  Plus,
  ScrollText,
  ShieldAlert,
  Swords,
  Target,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLessons } from "../lib/api";
import { getNextRankThreshold, getRankFromXp, useAppStore } from "../store/appStore";

export function DashboardPage() {
  const token = useAppStore((state) => state.token);
  const xp = useAppStore((state) => state.xp);
  const streak = useAppStore((state) => state.streak);
  const lessonsCompleted = useAppStore((state) => state.lessonsCompleted);
  const lessons = useAppStore((state) => state.lessons);
  const setLessons = useAppStore((state) => state.setLessons);
  const completedLessonIds = useAppStore((state) => state.completedLessonIds);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    void fetchLessons({ token, page: 1, pageSize: 24, signal: controller.signal })
      .then((result) => {
        setLessons(result.items);
        setStatus("success");
      })
      .catch((loadError) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Failed to load dashboard.");
        setStatus("error");
      });
    return () => controller.abort();
  }, [setLessons, token]);

  const rank = getRankFromXp(xp);
  const nextThreshold = getNextRankThreshold(xp);
  const xpToNext = Math.max(0, nextThreshold - xp);
  const progressPct = nextThreshold <= 0 ? 100 : Math.min(100, (xp / nextThreshold) * 100);
  const masteryPercent = lessons.length === 0 ? 0 : Math.round((lessonsCompleted / lessons.length) * 100);
  const featuredLesson = lessons[0] ?? null;

  return (
    <motion.div
      className="dashboard-modern"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="academy-headline">
        <div className="academy-headline-copy">
          <h1>Welcome back, Operative.</h1>
          <p>The Crimson Moon rises. Ready for today&apos;s directives?</p>
        </div>
        <div className="academy-headline-badges">
          <span>
            <Flame size={14} />
            {streak} Day Bloodline
          </span>
          <span>Rank {rank}</span>
        </div>
      </header>

      <section className="dashboard-stats-grid">
        <article className="dash-stat-card">
          <div className="dash-stat-head">
            <h2>Crimson Energy</h2>
            <div className="dash-stat-icon">
              <Zap size={16} />
            </div>
          </div>
          <div className="dash-stat-main">
            <strong>{xp.toLocaleString("en-US")} XP</strong>
            <p>{xpToNext} XP to rank up</p>
            <div className="dash-inline-progress">
              <span style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-head">
            <h2>Directives Executed</h2>
            <div className="dash-stat-icon">
              <Target size={16} />
            </div>
          </div>
          <div className="dash-stat-main">
            <strong>{lessons.length}</strong>
            <p>{lessonsCompleted} marked complete</p>
          </div>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-head">
            <h2>Combat Mastery</h2>
            <div className="dash-stat-icon">
              <Check size={16} />
            </div>
          </div>
          <div className="dash-stat-main">
            <strong>{masteryPercent}%</strong>
            <p>Rank {rank} · {streak} day streak</p>
          </div>
        </article>
      </section>

      <section className="dashboard-action-grid">
        <article className="dash-feature-card">
          <div className="dash-feature-icon">
            <ShieldAlert size={26} />
          </div>
          <div className="dash-feature-copy">
            <small>Active Directive</small>
            <h3>{featuredLesson ? featuredLesson.title : "No active mission yet"}</h3>
            <p>
              {featuredLesson
                ? "Continue your current training path and complete the remaining challenges."
                : "Upload your first tome to generate an interactive training mission."}
            </p>
          </div>
          <div className="dash-feature-actions">
            {featuredLesson ? (
              <Link to={`/lesson/${featuredLesson.id}`}>Execute Mission</Link>
            ) : (
              <Link to="/upload">Upload Intel</Link>
            )}
            <button type="button">
              <Swords size={15} />
              Sparring Challenge
            </button>
          </div>
        </article>

        <aside className="dash-command-card">
          <h3>Command Center</h3>
          <Link to="/upload" className="dash-command-link">
            <FileUp size={18} />
            <span>
              <strong>Submit Intelligence</strong>
              <small>Process new operational data</small>
            </span>
          </Link>
          <Link to="/dashboard" className="dash-command-link">
            <ScrollText size={18} />
            <span>
              <strong>Review Protocols</strong>
              <small>Track your open tomes</small>
            </span>
          </Link>
          <Link to="/dashboard" className="dash-command-link">
            <BarChart3 size={18} />
            <span>
              <strong>Assess Power Level</strong>
              <small>View progression and mastery trend</small>
            </span>
          </Link>
        </aside>
      </section>

      <section className="contract-board">
        <div className="contract-stat-grid">
          <article>
            <h2>{rank}</h2>
            <p>Current Rank</p>
          </article>
          <article>
            <h2>{xp.toLocaleString("en-US")}</h2>
            <p>Total XP</p>
          </article>
          <article>
            <h2 className="streak-value">
              <Flame size={16} /> {streak}
            </h2>
            <p>Current Streak</p>
          </article>
          <article>
            <h2 className="mastered-value">
              <Check size={16} /> {lessonsCompleted}
            </h2>
            <p>Tomes Mastered</p>
          </article>
        </div>
        <div className="contract-progress-wrap">
          <div className="contract-progress-track">
            <motion.div
              className="contract-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 16 }}
            />
          </div>
          <p>{xpToNext} XP to next rank</p>
        </div>
      </section>

      <section className="tomes-section">
        <h2>Your Tomes</h2>
        <div className="tomes-grid">
          {status === "loading" ? (
            <article className="tome-card tome-card-loading">
              <span className="loading-glyph">✦</span>
              <p>The Director is indexing your tomes...</p>
            </article>
          ) : null}
          {status === "error" ? (
            <article className="tome-card tome-card-error">
              <p>{error ?? "Failed to load tomes."}</p>
            </article>
          ) : null}
          {status === "success" && lessons.length === 0 ? (
            <article className="tome-card tome-empty">
              <ScrollText size={24} />
              <p>No tomes yet. The Director awaits your first upload.</p>
              <Link to="/upload">Upload your first tome</Link>
            </article>
          ) : null}
          {status === "success" &&
            lessons.map((lesson, index) => {
              const done = completedLessonIds.includes(lesson.id);
              const completion = done ? 100 : Math.min(92, 24 + lesson.challengeCount * 12);
              return (
                <motion.article
                  key={lesson.id}
                  className="tome-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.25 }}
                >
                  <h3>{lesson.title}</h3>
                  <p>{done ? "Contract marked complete." : "The Director has prepared this lesson for your review."}</p>
                  <div className="tome-meta-row">
                    <span>{lesson.challengeCount} challenges</span>
                    <div className="tome-mini-progress">
                      <span style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                  <Link to={`/lesson/${lesson.id}`}>{done ? "Continue" : "Begin"}</Link>
                </motion.article>
              );
            })}
        </div>
      </section>

      <Link className="floating-upload-btn" to="/upload" aria-label="Upload new tome">
        <Plus size={18} />
      </Link>
    </motion.div>
  );
}

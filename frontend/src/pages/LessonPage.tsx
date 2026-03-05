import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CodingChallengeCard } from "../components/lesson/CodingChallengeCard";
import { McqChallengeCard } from "../components/lesson/McqChallengeCard";
import { fetchLessonById, submitAttempt } from "../lib/api";
import { useAppStore } from "../store/appStore";
import type {
  AttemptResponse,
  CodingLessonChallenge,
  LessonDetail,
  McqLessonChallenge
} from "../types/lesson";

type IntroStep = { type: "intro" };
type ConceptStep = {
  type: "concept";
  title: string;
  text: string;
  snippet?: string;
  quote?: { term: string; definition: string };
};
type KeyTermsStep = { type: "key_terms" };
type InsightStep = { type: "insight"; headline: string; explanation: string };
type McqStep = { type: "mcq"; challenge: McqLessonChallenge };
type CodingStep = { type: "coding"; challenge: CodingLessonChallenge };
type CompleteStep = { type: "complete" };
type LessonStep = IntroStep | ConceptStep | KeyTermsStep | InsightStep | McqStep | CodingStep | CompleteStep;

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function chunkSentences(sentences: string[], maxWords = 70): string[] {
  if (sentences.length === 0) {
    return [];
  }
  const chunks: string[] = [];
  let current = "";
  let words = 0;
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
    if (words + sentenceWords > maxWords && current) {
      chunks.push(current.trim());
      current = sentence;
      words = sentenceWords;
    } else {
      current = `${current} ${sentence}`.trim();
      words += sentenceWords;
    }
  }
  if (current) {
    chunks.push(current.trim());
  }
  return chunks;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const emphasisTokens = [
  "important",
  "remember",
  "because",
  "therefore",
  "note",
  "must",
  "key",
  "critical",
  "važno",
  "zapamti",
  "zato",
  "dakle",
  "bitno"
];

const emphasisRegex = new RegExp(`\\b(${emphasisTokens.map(escapeRegex).join("|")})\\b`, "gi");

function formatWithEmphasis(text: string) {
  return text.split(emphasisRegex).map((part, index) =>
    emphasisTokens.some((token) => token.toLowerCase() === part.toLowerCase()) ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      <Fragment key={`${part}-${index}`}>{part}</Fragment>
    )
  );
}

function toReadableParagraphs(text: string): string[] {
  return chunkSentences(splitIntoSentences(text), 38);
}

function toTakeaway(text: string): string {
  const sentences = splitIntoSentences(text);
  const prioritized =
    sentences.find((sentence) => emphasisTokens.some((token) => sentence.toLowerCase().includes(token))) ??
    sentences[0] ??
    text;
  const words = prioritized.split(/\s+/).filter(Boolean);
  if (words.length <= 16) {
    return prioritized;
  }
  return `${words.slice(0, 16).join(" ")}...`;
}

export function LessonPage() {
  const token = useAppStore((state) => state.token);
  const applyAttemptResult = useAppStore((state) => state.applyAttemptResult);
  const streak = useAppStore((state) => state.streak);
  const { id } = useParams();
  const lessonId = Number(id);

  const [payload, setPayload] = useState<LessonDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [solvedChallengeIds, setSolvedChallengeIds] = useState<number[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const draftStorageKey = `lesson-${lessonId}-coding-drafts`;
  const [codingDrafts, setCodingDrafts] = useState<Record<number, string>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      return raw ? (JSON.parse(raw) as Record<number, string>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!token || Number.isNaN(lessonId)) {
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setFeedback(null);
    void fetchLessonById(token, lessonId, controller.signal)
      .then((result) => {
        setPayload(result);
        setCurrentStepIndex(0);
        setStatus("success");
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        setStatus("error");
        setFeedback(error instanceof Error ? error.message : "Failed to load lesson.");
      });
    return () => controller.abort();
  }, [lessonId, token]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(draftStorageKey, JSON.stringify(codingDrafts));
  }, [codingDrafts, draftStorageKey]);

  const applyResult = (result: AttemptResponse) => {
    if (result.intent !== "submit") {
      return;
    }
    applyAttemptResult({
      lessonId,
      gainedXp: result.gainedXp,
      isCorrect: result.isCorrect,
      streakFromBackend: result.streakDays
    });
  };

  const onMcqAttempt = async (challengeId: number, selectedIndex: number): Promise<AttemptResponse> => {
    if (!token) {
      throw new Error("Missing auth token.");
    }
    const result = await submitAttempt({
      token,
      challengeId,
      submission: { type: "mcq", selectedIndex }
    });
    applyResult(result);
    if (result.isCorrect) {
      setSolvedChallengeIds((current) => (current.includes(challengeId) ? current : [...current, challengeId]));
    }
    setFeedback(result.isCorrect ? `Great work. +${result.gainedXp} XP gained.` : "Not quite. Try one more time.");
    return result;
  };

  const onCodingAttempt = async (
    challengeId: number,
    code: string,
    intent: "check" | "submit"
  ): Promise<AttemptResponse> => {
    if (!token) {
      throw new Error("Missing auth token.");
    }
    const result = await submitAttempt({
      token,
      challengeId,
      submission: { type: "coding", code, intent }
    });
    applyResult(result);
    if (intent === "submit" && result.isCorrect) {
      setSolvedChallengeIds((current) => (current.includes(challengeId) ? current : [...current, challengeId]));
    }
    setFeedback(result.intent === "check" ? "Checks complete." : result.isCorrect ? "Challenge completed." : "Try again.");
    return result;
  };

  const steps = useMemo<LessonStep[]>(() => {
    if (!payload) {
      return [];
    }
    const codingChallenges = payload.challenges.filter(
      (challenge): challenge is CodingLessonChallenge => challenge.type === "coding"
    );
    const fallbackSnippet = codingChallenges[0]?.starterCode;
    const conceptChunks = chunkSentences(splitIntoSentences(payload.lesson.summary), 70).map((chunk, index) => {
      const mentionsCode = /(code|class|method|java|loop|function|compile)/i.test(chunk);
      const keyTerm = payload.lesson.keyTerms[index % Math.max(payload.lesson.keyTerms.length, 1)];
      return {
        type: "concept" as const,
        title: `Concept ${index + 1}`,
        text: chunk,
        snippet: mentionsCode ? fallbackSnippet : undefined,
        quote: mentionsCode ? undefined : keyTerm
      };
    });

    const mcqSteps = payload.challenges
      .filter((challenge): challenge is McqLessonChallenge => challenge.type === "mcq")
      .map((challenge) => ({ type: "mcq" as const, challenge }));
    const codingSteps = codingChallenges.map((challenge) => ({ type: "coding" as const, challenge }));
    const insightSteps = payload.lesson.insights.map((insight) => ({
      type: "insight" as const,
      headline: insight.headline,
      explanation: insight.explanation
    }));

    return [
      { type: "intro" },
      ...conceptChunks,
      { type: "key_terms" },
      ...insightSteps,
      ...mcqSteps,
      ...codingSteps,
      { type: "complete" }
    ];
  }, [payload]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex] ?? null;

  const goNext = () => {
    setDirection(1);
    setCurrentStepIndex((index) => Math.min(totalSteps - 1, index + 1));
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const jumpToStep = (index: number) => {
    const target = Math.min(Math.max(index, 0), totalSteps - 1);
    if (target === currentStepIndex) {
      return;
    }
    setDirection(target > currentStepIndex ? 1 : -1);
    setCurrentStepIndex(target);
  };

  return (
    <motion.section
      className="lesson-step-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {status === "loading" ? <p className="lesson-muted">The Director is preparing the tome...</p> : null}
      {status === "error" ? <p className="inline-error">{feedback ?? "Failed to load tome."}</p> : null}

      {payload && currentStep ? (
        <>
          <header className="lesson-step-header">
            <div className="lesson-step-meta">
              <small>
                Step {currentStepIndex + 1} of {totalSteps}
              </small>
              <div className="lesson-step-meta-actions">
                <button
                  type="button"
                  className="retry-btn lesson-step-skip-btn"
                  onClick={() => jumpToStep(currentStepIndex - 1)}
                  disabled={currentStepIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="retry-btn lesson-step-skip-btn"
                  onClick={() => jumpToStep(currentStepIndex + 1)}
                  disabled={currentStepIndex === totalSteps - 1}
                >
                  Skip Ahead →
                </button>
                <Link to="/dashboard">← Back to Dashboard</Link>
              </div>
            </div>
            <div className="lesson-step-progress-segments">
              {steps.map((step, index) => (
                <button
                  type="button"
                  key={`${step.type}-${index}`}
                  aria-label={`Jump to step ${index + 1}`}
                  className={`lesson-step-segment ${
                    index < currentStepIndex ? "complete" : index === currentStepIndex ? "active" : "upcoming"
                  }`}
                  onClick={() => jumpToStep(index)}
                />
              ))}
            </div>
          </header>

          <div className="lesson-step-viewport">
            <AnimatePresence mode="wait" initial={false}>
              <motion.article
                key={`step-${currentStepIndex}-${currentStep.type}`}
                className={`lesson-step-card lesson-step-${currentStep.type}`}
                initial={{ x: direction > 0 ? 110 : -110, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -110 : 110, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {currentStep.type === "intro" ? (
                  <div className="lesson-intro-step lesson-reading-surface">
                    <p className="lesson-step-kicker">What you will learn</p>
                    <h1>{payload.lesson.title}</h1>
                    <div className="lesson-step-rule" />
                    <section className="lesson-reading-block">
                      <h3>Main explanation</h3>
                      {toReadableParagraphs(payload.lesson.summary).map((paragraph, index) => (
                        <p key={`intro-paragraph-${index}`} className="lesson-readable-paragraph">
                          {formatWithEmphasis(paragraph)}
                        </p>
                      ))}
                    </section>
                    <aside className="lesson-step-callout lesson-step-callout-takeaway">
                      <h4>Key takeaway</h4>
                      <p>{formatWithEmphasis(toTakeaway(payload.lesson.summary))}</p>
                    </aside>
                  </div>
                ) : null}

                {currentStep.type === "concept" ? (
                  <div className="lesson-concept-step">
                    <div className="lesson-concept-copy lesson-reading-surface">
                      <p className="lesson-step-kicker">Concept focus</p>
                      <h2>{currentStep.title}</h2>
                      <section className="lesson-reading-block">
                        <h3>What this step teaches</h3>
                        <p className="lesson-readable-paragraph">{formatWithEmphasis(toTakeaway(currentStep.text))}</p>
                      </section>
                      <section className="lesson-reading-block">
                        <h3>Main explanation</h3>
                        {toReadableParagraphs(currentStep.text).map((paragraph, index) => (
                          <p key={`concept-${currentStep.title}-${index}`} className="lesson-readable-paragraph">
                            {formatWithEmphasis(paragraph)}
                          </p>
                        ))}
                      </section>
                      <aside className="lesson-step-callout lesson-step-callout-takeaway">
                        <h4>Key takeaway</h4>
                        <p>{formatWithEmphasis(toTakeaway(currentStep.text))}</p>
                      </aside>
                    </div>
                    <aside className="lesson-concept-side">
                      {currentStep.snippet ? (
                        <div className="lesson-side-block">
                          <h4>Quick example</h4>
                          <pre>
                          <code>{currentStep.snippet}</code>
                          </pre>
                        </div>
                      ) : currentStep.quote ? (
                        <blockquote className="lesson-side-block">
                          <h5>Related term</h5>
                          <h4>{currentStep.quote.term}</h4>
                          <p>{currentStep.quote.definition}</p>
                        </blockquote>
                      ) : null}
                    </aside>
                  </div>
                ) : null}

                {currentStep.type === "key_terms" ? (
                  <div className="lesson-terms-step lesson-reading-surface">
                    <p className="lesson-step-kicker">Memory anchors</p>
                    <h2>Key Terms</h2>
                    <aside className="lesson-step-callout">
                      <h4>How to study this step</h4>
                      <p>
                        Say each term out loud, then explain it in your own words. That is the fastest route to retention.
                      </p>
                    </aside>
                    <div className="lesson-term-grid">
                      {payload.lesson.keyTerms.map((item, index) => (
                        <motion.article
                          key={item.term}
                          className="lesson-term-card"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.2 }}
                        >
                          <h3>{item.term}</h3>
                          <p>{item.definition}</p>
                        </motion.article>
                      ))}
                    </div>
                  </div>
                ) : null}

                {currentStep.type === "insight" ? (
                  <div className="lesson-insight-step lesson-reading-surface">
                    <span className="lesson-insight-quote-mark">"</span>
                    <p className="lesson-step-kicker">Aha insight</p>
                    <h2>{currentStep.headline}</h2>
                    <section className="lesson-reading-block">
                      <h3>Main explanation</h3>
                      {toReadableParagraphs(currentStep.explanation).map((paragraph, index) => (
                        <p key={`insight-${currentStep.headline}-${index}`} className="lesson-readable-paragraph">
                          {formatWithEmphasis(paragraph)}
                        </p>
                      ))}
                    </section>
                    <aside className="lesson-step-callout lesson-step-callout-takeaway">
                      <h4>Key takeaway</h4>
                      <p>{formatWithEmphasis(toTakeaway(currentStep.explanation))}</p>
                    </aside>
                  </div>
                ) : null}

                {currentStep.type === "mcq" ? (
                  <McqChallengeCard
                    challenge={currentStep.challenge}
                    onAttempt={onMcqAttempt}
                    onContinue={goNext}
                  />
                ) : null}

                {currentStep.type === "coding" ? (
                  <CodingChallengeCard
                    challenge={currentStep.challenge}
                    initialCode={codingDrafts[currentStep.challenge.id]}
                    onDraftChange={(challengeId, code) =>
                      setCodingDrafts((current) => ({
                        ...current,
                        [challengeId]: code
                      }))
                    }
                    onCheck={(challengeId, code) => onCodingAttempt(challengeId, code, "check")}
                    onSubmit={(challengeId, code) => onCodingAttempt(challengeId, code, "submit")}
                    onContinue={goNext}
                  />
                ) : null}

                {currentStep.type === "complete" ? (
                  <div className="lesson-complete-step">
                    <div className="lesson-complete-seal">✦</div>
                    <h2>Contract Fulfilled.</h2>
                    <div className="lesson-complete-stats">
                      <p>Challenges Solved: {solvedChallengeIds.length}</p>
                      <p>Current Streak: {streak}</p>
                    </div>
                    <div className="lesson-complete-actions">
                      <Link to="/dashboard">Return to Dashboard</Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDirection(-1);
                          setCurrentStepIndex(0);
                        }}
                      >
                        Review Lesson
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.article>
            </AnimatePresence>
          </div>

          {!["mcq", "coding", "complete"].includes(currentStep.type) ? (
            <footer className="lesson-step-footer">
              <button type="button" className="retry-btn" onClick={goPrev} disabled={currentStepIndex === 0}>
                ← Back
              </button>
              <button type="button" className="resolve-btn" onClick={goNext}>
                {currentStep.type === "intro" ? "Begin →" : currentStep.type === "insight" ? "Got it →" : "Continue →"}
              </button>
            </footer>
          ) : null}

          {feedback ? <p className="lesson-step-feedback">{feedback}</p> : null}
        </>
      ) : null}
    </motion.section>
  );
}


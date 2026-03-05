import { useMemo, useState } from "react";
import type { AttemptResponse, McqLessonChallenge } from "../../types/lesson";

type McqChallengeCardProps = {
  challenge: McqLessonChallenge;
  onAttempt: (challengeId: number, selectedIndex: number) => Promise<AttemptResponse>;
  onContinue: () => void;
};

export function McqChallengeCard({ challenge, onAttempt, onContinue }: McqChallengeCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AttemptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const feedback = useMemo(() => {
    if (!result) {
      return null;
    }
    const evaluation = result.evaluation;
    if (evaluation.type !== "mcq") {
      return null;
    }
    let wrongExplanation: string | undefined;
    if (selectedIndex !== null && !result.isCorrect) {
      const wrongSlots = [0, 1, 2, 3].filter((index) => index !== evaluation.correctIndex);
      const wrongExplanationIndex = wrongSlots.indexOf(selectedIndex);
      wrongExplanation = evaluation.whyWrongExplanations?.[wrongExplanationIndex];
    }
    return result.isCorrect ? evaluation.explanation : (wrongExplanation ?? evaluation.explanation);
  }, [result, selectedIndex]);

  const submit = async (): Promise<void> => {
    if (selectedIndex === null || pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const attempt = await onAttempt(challenge.id, selectedIndex);
      setResult(attempt);
    } catch (attemptError) {
      setError(attemptError instanceof Error ? attemptError.message : "Failed to submit answer.");
    } finally {
      setPending(false);
    }
  };

  const canContinue = Boolean(result?.isCorrect || retryCount >= 1);
  const showTryAgain = Boolean(result && !result.isCorrect && retryCount < 1);
  const evaluation = result?.evaluation.type === "mcq" ? result.evaluation : null;
  const correctIndex = evaluation?.correctIndex ?? -1;
  const awardedXp = result?.isCorrect && result.intent === "submit" ? result.gainedXp : 0;

  const optionClassName = (index: number): string => {
    if (!result || !evaluation) {
      return `mcq-option ${selectedIndex === index ? "selected" : ""}`;
    }
    if (index === correctIndex) {
      return "mcq-option mcq-option-correct";
    }
    if (selectedIndex === index && !result.isCorrect) {
      return "mcq-option mcq-option-wrong";
    }
    return "mcq-option mcq-option-muted";
  };

  return (
    <article className="challenge-card challenge-card-interactive">
      <div className="challenge-head">
        <h3>{challenge.question}</h3>
        <span className="challenge-chip">MCQ · {challenge.difficulty}</span>
      </div>
      <p className="challenge-instruction">
        <strong>How to answer:</strong> pick the strongest option, then use the feedback to correct your reasoning.
      </p>
      <div className="mcq-options" role="radiogroup" aria-label={challenge.question}>
        {challenge.options.map((option, index) => (
          <button
            key={`${challenge.id}-${index}`}
            className={optionClassName(index)}
            type="button"
            onClick={() => setSelectedIndex(index)}
            disabled={pending || !!result}
          >
            <span>{String.fromCharCode(65 + index)}.</span> {option}
            {result && index === correctIndex ? <strong className="mcq-mark">✓</strong> : null}
          </button>
        ))}
      </div>
      <div className="challenge-actions">
        {!result ? (
          <button type="button" className="resolve-btn" onClick={() => void submit()} disabled={selectedIndex === null || pending}>
            {pending ? "Checking..." : "Check Answer"}
          </button>
        ) : null}
        {showTryAgain ? (
          <button
            type="button"
            className="retry-btn"
            onClick={() => {
              setRetryCount((count) => count + 1);
              setResult(null);
              setSelectedIndex(null);
            }}
          >
            Try Again
          </button>
        ) : null}
        {canContinue ? (
          <button type="button" className="resolve-btn" onClick={onContinue}>
            Continue →
          </button>
        ) : null}
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
      {result ? (
        <>
          <p className={`lesson-muted ${result.isCorrect ? "feedback-correct" : "feedback-wrong"}`}>
            <strong>{result.isCorrect ? "Correct reasoning:" : "Common pitfall:"}</strong>{" "}
            {feedback}
          </p>
          {awardedXp > 0 ? <span className="xp-badge-floating">+{awardedXp} XP</span> : null}
        </>
      ) : null}
    </article>
  );
}


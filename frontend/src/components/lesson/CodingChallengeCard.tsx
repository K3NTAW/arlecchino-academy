import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import type { AttemptResponse, CodingLessonChallenge } from "../../types/lesson";

type CodingChallengeCardProps = {
  challenge: CodingLessonChallenge;
  initialCode?: string;
  onDraftChange: (challengeId: number, code: string) => void;
  onCheck: (challengeId: number, code: string) => Promise<AttemptResponse>;
  onSubmit: (challengeId: number, code: string) => Promise<AttemptResponse>;
  onContinue: () => void;
};

export function CodingChallengeCard({
  challenge,
  initialCode,
  onDraftChange,
  onCheck,
  onSubmit,
  onContinue
}: CodingChallengeCardProps) {
  const [code, setCode] = useState(initialCode ?? challenge.starterCode);
  const [pendingAction, setPendingAction] = useState<"check" | "submit" | null>(null);
  const [result, setResult] = useState<AttemptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  const doAction = async (action: "check" | "submit") => {
    if (!code.trim() || pendingAction) {
      return;
    }
    setPendingAction(action);
    setError(null);
    try {
      const attempt = action === "check" ? await onCheck(challenge.id, code) : await onSubmit(challenge.id, code);
      setResult(attempt);
    } catch (attemptError) {
      setError(attemptError instanceof Error ? attemptError.message : "Failed to evaluate code.");
    } finally {
      setPendingAction(null);
    }
  };

  const codingEvaluation = useMemo(
    () => (result?.evaluation.type === "coding" ? result.evaluation : null),
    [result]
  );

  return (
    <article className="challenge-card challenge-card-interactive challenge-card-coding">
      <div className="challenge-step-badge">Challenge · Code</div>
      <div className="coding-step-layout">
        <div className="coding-step-editor">
          <div className="lesson-step-callout">
            <h4>Task</h4>
            <p>{challenge.question}</p>
          </div>
          <div className="code-editor-wrap">
            <Editor
              language="java"
              height="100%"
              value={code}
              onChange={(value) => {
                const nextCode = value ?? "";
                setCode(nextCode);
                onDraftChange(challenge.id, nextCode);
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                automaticLayout: true
              }}
              theme="vs-dark"
            />
          </div>
          <div className="challenge-actions">
            <button
              type="button"
              className="retry-btn"
              disabled={pendingAction !== null}
              onClick={() => void doAction("check")}
            >
              {pendingAction === "check" ? "Running..." : "Run Code"}
            </button>
            <button
              type="button"
              className="resolve-btn"
              disabled={pendingAction !== null}
              onClick={() => void doAction("submit")}
            >
              {pendingAction === "submit" ? "Submitting..." : "Submit Solution"}
            </button>
            {result?.isCorrect ? (
              <button type="button" className="resolve-btn" onClick={onContinue}>
                Continue →
              </button>
            ) : null}
          </div>
        </div>
        <div className="coding-step-info">
          <div className="challenge-head">
            <h3>{challenge.question}</h3>
            <span className="challenge-chip">Coding · {challenge.difficulty}</span>
          </div>
          <div className="lesson-step-callout lesson-step-callout-caution">
            <h4>Before you run</h4>
            <p>Read each test case first. Align input/output format exactly before debugging logic.</p>
          </div>
          <button type="button" className="hint-toggle-btn" onClick={() => setHintVisible((show) => !show)}>
            {hintVisible ? "Hide Hint" : "Reveal Hint"} <small>(may cost XP)</small>
          </button>
          {hintVisible ? <p className="lesson-muted">{challenge.hint}</p> : null}
          <div className="test-case-table-wrap">
            <h4>Test Cases</h4>
            <table className="test-case-table">
              <thead>
                <tr>
                  <th>Input</th>
                  <th>Expected</th>
                </tr>
              </thead>
              <tbody>
                {challenge.testCases.map((testCase, index) => (
                  <tr key={`${challenge.id}-case-${index}`}>
                    <td>{testCase.input || "(empty)"}</td>
                    <td>{testCase.expected || "(empty)"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {error ? <p className="inline-error">{error}</p> : null}
      {codingEvaluation ? (
        <div className={`coding-results ${result?.isCorrect ? "coding-success" : ""}`}>
          <p className={`lesson-muted ${result?.isCorrect ? "feedback-correct" : "feedback-wrong"}`}>
            {result?.isCorrect
              ? "Aha! All tests passed. Contract conditions satisfied."
              : "Some tests failed. Read the failing cases and try again."}
          </p>
          <p className="coding-results-label">
            <strong>What failed:</strong> compare expected vs actual for every failed case.
          </p>
          <div className="test-case-list">
            {codingEvaluation.testResults.map((test, index) => (
              <div key={`${challenge.id}-result-${index}`} className={`test-case ${test.passed ? "passed" : "failed"}`}>
                <p>
                  Case {index + 1}: <strong>{test.passed ? "Pass" : "Fail"}</strong>
                </p>
                <small>
                  <strong>Input:</strong> {test.input || "(empty)"}
                </small>
                <small className="test-case-expected">
                  <strong>Expected:</strong> {test.expected || "(empty)"}
                </small>
                <small className="test-case-actual">
                  <strong>Actual:</strong> {test.actual || "(empty)"}
                </small>
                {test.error ? <small>Error: {test.error}</small> : null}
              </div>
            ))}
          </div>
          {codingEvaluation.ahaInsight ? <p className="lesson-muted">{codingEvaluation.ahaInsight}</p> : null}
          {result?.isCorrect && result.intent === "submit" ? (
            <span className="xp-badge-floating">+{result.gainedXp} XP</span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}


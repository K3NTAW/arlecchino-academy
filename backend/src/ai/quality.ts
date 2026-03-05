import type { LessonBundle } from "@academy/shared";

const coverageChecks = [
  { id: "immutability", pattern: /imutabil|immutab/i },
  { id: "string object", pattern: /klasa string|string class|string objekat|string object/i },
  { id: "string literal", pattern: /literal|string s1 =|new string/i },
  { id: "stringbuilder", pattern: /stringbuilder/i },
  { id: "stringbuffer", pattern: /stringbuffer/i },
  { id: "pooling", pattern: /pooling|string pool/i },
  { id: "empty vs null", pattern: /empty string|prazan string|null/i }
] as const;

export function validateChallengeQuality(bundle: LessonBundle, sourceText?: string): string[] {
  const issues: string[] = [];
  const codingCount = bundle.challenges.filter((challenge) => challenge.type === "coding").length;
  const mcqCount = bundle.challenges.filter((challenge) => challenge.type === "mcq").length;

  if (codingCount === 0 || mcqCount === 0) {
    issues.push("Challenge set must include both coding and MCQ challenges.");
  }

  if (bundle.lesson.summary.trim().length < 220) {
    issues.push("Lesson summary is too short for deep teaching quality.");
  }

  if (bundle.lesson.keyTerms.length < 5) {
    issues.push("Lesson should include at least five key terms.");
  }

  for (const challenge of bundle.challenges) {
    if (challenge.type === "coding") {
      const questionLower = challenge.question.toLowerCase();
      const hasRunnableVerb = /\b(complete|fill|implement|fix|correct|write|finish)\b/.test(questionLower);
      const hasNonRunnableVerb = /\b(explain|describe|why|predict)\b/.test(questionLower);
      const hasInputContract = /\binput\b/.test(questionLower);
      const hasOutputContract = /\boutput\b/.test(questionLower);

      if (!hasRunnableVerb || hasNonRunnableVerb) {
        issues.push(`Coding challenge ${challenge.id} must be a runnable complete/fix task.`);
      }
      if (!hasInputContract || !hasOutputContract) {
        issues.push(`Coding challenge ${challenge.id} must specify explicit input and output format.`);
      }
      if (!challenge.solution.includes("return") && !challenge.solution.includes("print")) {
        issues.push(`Coding challenge ${challenge.id} has weak solution signal.`);
      }
      if (challenge.testCases.length === 0) {
        issues.push(`Coding challenge ${challenge.id} must include test cases.`);
      }
      for (const [index, testCase] of challenge.testCases.entries()) {
        if (testCase.expected.trim().length === 0) {
          issues.push(`Coding challenge ${challenge.id} test case ${index + 1} has empty expected output.`);
        }
        if (testCase.input.trim().length === 0 && testCase.expected.trim().length === 0) {
          issues.push(`Coding challenge ${challenge.id} test case ${index + 1} is empty.`);
        }
      }
      const questionMentionsString = /\bstring\b/.test(questionLower);
      if (questionMentionsString) {
        const numericOnlyCases = challenge.testCases.every(
          (tc) =>
            /^[\d\s.-]+$/.test(tc.input.trim()) &&
            /^[\d\s.-]+$/.test(tc.expected.trim())
        );
        if (numericOnlyCases) {
          issues.push(`Coding challenge ${challenge.id} question/test-case mismatch: string-focused prompt with numeric-only cases.`);
        }
      }
    }

    if (challenge.type === "mcq") {
      if (challenge.options[challenge.correctIndex] === undefined) {
        issues.push(`MCQ challenge ${challenge.id} has invalid correct index.`);
      }
      if (challenge.explanation.trim().length < 40) {
        issues.push(`MCQ challenge ${challenge.id} explanation is too short.`);
      }
    }
  }

  if (sourceText && sourceText.trim().length > 0) {
    const sourceLower = sourceText.toLowerCase();
    const generatedLower = JSON.stringify(bundle).toLowerCase();
    for (const check of coverageChecks) {
      if (check.pattern.test(sourceLower) && !check.pattern.test(generatedLower)) {
        issues.push(`Missing source concept coverage: ${check.id}.`);
      }
    }
  }

  return issues;
}

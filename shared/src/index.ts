import { z } from "zod";

export const KeyTermSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1)
});

export const InsightSchema = z.object({
  headline: z.string().min(1),
  explanation: z.string().min(1)
});

export const LessonSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  keyTerms: z.array(KeyTermSchema).min(1),
  insights: z.array(InsightSchema).min(1),
  language: z.enum(["en", "sr"])
});

export const CodingTestCaseSchema = z.object({
  input: z.string(),
  expected: z.string()
});

export const CodingChallengeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("coding"),
  question: z.string().min(1),
  starterCode: z.string().min(1),
  solution: z.string().min(1),
  hint: z.string().min(1),
  ahaInsight: z.string().min(1),
  testCases: z.array(CodingTestCaseSchema).min(1)
});

export const McqChallengeSchema = z.object({
  id: z.string().min(1),
  type: z.literal("mcq"),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  whyWrongExplanations: z.array(z.string().min(1)).length(3)
});

export const ChallengeSchema = z.discriminatedUnion("type", [
  CodingChallengeSchema,
  McqChallengeSchema
]);

export const LessonBundleSchema = z.object({
  lesson: LessonSchema,
  challenges: z.array(ChallengeSchema).min(1)
});

export const GenerateRequestSchema = z.object({
  extractedText: z.string().min(1),
  language: z.enum(["en", "sr"]).default("en")
});

export const McqAttemptRequestSchema = z.object({
  type: z.literal("mcq"),
  selectedIndex: z.number().int().min(0).max(3)
});

export const CodingAttemptRequestSchema = z.object({
  type: z.literal("coding"),
  code: z.string().min(1),
  intent: z.enum(["check", "submit"]).default("submit")
});

export const ChallengeAttemptRequestSchema = z.discriminatedUnion("type", [
  McqAttemptRequestSchema,
  CodingAttemptRequestSchema
]);

export const CodingTestResultSchema = z.object({
  input: z.string(),
  expected: z.string(),
  actual: z.string(),
  passed: z.boolean(),
  error: z.string().optional()
});

export const McqAttemptEvaluationSchema = z.object({
  type: z.literal("mcq"),
  selectedIndex: z.number().int().min(0).max(3),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  whyWrongExplanations: z.array(z.string().min(1)).length(3).optional()
});

export const CodingAttemptEvaluationSchema = z.object({
  type: z.literal("coding"),
  code: z.string().min(1),
  hint: z.string().optional(),
  ahaInsight: z.string().optional(),
  testResults: z.array(CodingTestResultSchema)
});

export const ChallengeAttemptEvaluationSchema = z.discriminatedUnion("type", [
  McqAttemptEvaluationSchema,
  CodingAttemptEvaluationSchema
]);

export const ChallengeAttemptResponseSchema = z.object({
  ok: z.literal(true),
  intent: z.enum(["check", "submit"]),
  isCorrect: z.boolean(),
  gainedXp: z.number().int().nonnegative(),
  gainedCurrency: z.number().int().nonnegative(),
  totalXp: z.number().int().nonnegative(),
  totalCurrency: z.number().int().nonnegative(),
  level: z.string().min(1),
  streakDays: z.number().int().nonnegative(),
  evaluation: ChallengeAttemptEvaluationSchema
});

export type Lesson = z.infer<typeof LessonSchema>;
export type Challenge = z.infer<typeof ChallengeSchema>;
export type LessonBundle = z.infer<typeof LessonBundleSchema>;
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type ChallengeAttemptRequest = z.infer<typeof ChallengeAttemptRequestSchema>;
export type ChallengeAttemptResponse = z.infer<typeof ChallengeAttemptResponseSchema>;
export type ChallengeAttemptEvaluation = z.infer<typeof ChallengeAttemptEvaluationSchema>;
export type CodingTestResult = z.infer<typeof CodingTestResultSchema>;

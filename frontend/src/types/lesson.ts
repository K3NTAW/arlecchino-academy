import type { Challenge, ChallengeAttemptRequest, ChallengeAttemptResponse } from "@academy/shared";

export type UploadExtracted = {
  text: string;
  imageCount: number;
  usedOcrFallback: boolean;
};

export type LessonListItem = {
  id: number;
  title: string;
  language: "en" | "sr";
  createdAt: string;
  challengeCount: number;
};

export type LessonListResponse = {
  items: LessonListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type LessonDetail = {
  lesson: {
    id: number;
    title: string;
    summary: string;
    keyTerms: Array<{ term: string; definition: string }>;
    insights: Array<{ headline: string; explanation: string }>;
    language: "en" | "sr";
  };
  challenges: LessonChallenge[];
};

type SharedMcqChallenge = Extract<Challenge, { type: "mcq" }>;
type SharedCodingChallenge = Extract<Challenge, { type: "coding" }>;

export type McqLessonChallenge = Omit<SharedMcqChallenge, "id"> & {
  id: number;
  difficulty: string;
};

export type CodingLessonChallenge = Omit<SharedCodingChallenge, "id"> & {
  id: number;
  difficulty: string;
};

export type LessonChallenge = McqLessonChallenge | CodingLessonChallenge;

export type AttemptRequest = ChallengeAttemptRequest;
export type AttemptResponse = ChallengeAttemptResponse;

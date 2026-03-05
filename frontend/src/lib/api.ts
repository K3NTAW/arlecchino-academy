import type { AttemptRequest, AttemptResponse, LessonDetail, LessonListResponse, UploadExtracted } from "../types/lesson";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";
const CONTRACT_ACCESS_CODE = import.meta.env.VITE_ACCESS_CODE ?? "arlecchino";

type ApiErrorBody = { message?: string };

type GenerateResponse = {
  lessonId: number;
  cached: boolean;
  qualityIssues: string[];
};

export type DashboardResponse = {
  xp: number;
  currency: number;
  documentCount: number;
  masteryPercent: number;
  streakDays: number;
  level: string;
  recentLesson: { id: number; title: string } | null;
  recentLessons: Array<{ id: number; title: string; createdAt: string }>;
};

async function readError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const errorBody = (await response.json()) as ApiErrorBody;
    return new Error(errorBody.message ?? fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

async function apiFetch<T>(
  path: string,
  input: {
    method?: "GET" | "POST";
    token?: string;
    body?: BodyInit;
    json?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const headers = new Headers();
  if (input.token) {
    headers.set("Authorization", `Bearer ${input.token}`);
  }
  if (input.json) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: input.method ?? "GET",
    body: input.body ?? (input.json ? JSON.stringify(input.json) : undefined),
    headers,
    signal: input.signal
  });

  if (!response.ok) {
    throw await readError(response, `Request failed: ${path}`);
  }

  return (await response.json()) as T;
}

export async function login(accessCode: string): Promise<{ token: string }> {
  return apiFetch<{ token: string }>("/api/login", {
    method: "POST",
    json: { accessCode }
  });
}

export async function loginContract(): Promise<{ token: string }> {
  return login(CONTRACT_ACCESS_CODE);
}

export async function logout(token: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/api/logout", {
    method: "POST",
    token
  });
}

export async function uploadPdf(token: string, file: File): Promise<UploadExtracted> {
  const formData = new FormData();
  formData.append("pdf", file);
  return apiFetch<UploadExtracted>("/api/upload", {
    method: "POST",
    token,
    body: formData
  });
}

export async function generateLesson(input: {
  token: string;
  extractedText: string;
  language: "en" | "sr";
  title?: string;
}): Promise<GenerateResponse> {
  return apiFetch<GenerateResponse>("/api/generate", {
    method: "POST",
    token: input.token,
    json: {
      extractedText: input.extractedText,
      language: input.language,
      title: input.title
    }
  });
}

export async function fetchLessons(input: {
  token: string;
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
}): Promise<LessonListResponse> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  return apiFetch<LessonListResponse>(`/api/lessons?page=${page}&pageSize=${pageSize}`, {
    token: input.token,
    signal: input.signal
  });
}

export async function fetchDashboard(token: string, signal?: AbortSignal): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>("/api/dashboard", { token, signal });
}

export async function fetchLessonById(
  token: string,
  lessonId: number,
  signal?: AbortSignal
): Promise<LessonDetail> {
  return apiFetch<LessonDetail>(`/api/lessons/${lessonId}`, { token, signal });
}

export async function submitAttempt(input: {
  token: string;
  challengeId: number;
  submission: AttemptRequest;
}): Promise<AttemptResponse> {
  return apiFetch<AttemptResponse>(`/api/challenges/${input.challengeId}/attempt`, {
    method: "POST",
    token: input.token,
    json: input.submission
  });
}

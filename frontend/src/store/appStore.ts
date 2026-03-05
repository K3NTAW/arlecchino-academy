import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GachaPullResponse, GachaState } from "@academy/shared";
import type { LessonListItem } from "../types/lesson";

const XP_PER_LEVEL = 250;

type AppStore = {
  name: string;
  token: string | null;
  language: "en" | "sr";
  xp: number;
  currency: number;
  streak: number;
  lessonsCompleted: number;
  lessons: LessonListItem[];
  gachaState: GachaState | null;
  completedLessonIds: number[];
  lastActiveDate: string | null;
  isGenerating: boolean;
  setSession: (input: { name: string; token: string }) => void;
  clearSession: () => void;
  setLanguage: (language: "en" | "sr") => void;
  setLessons: (lessons: LessonListItem[]) => void;
  upsertLesson: (lesson: LessonListItem) => void;
  setGenerating: (isGenerating: boolean) => void;
  hydrateProgress: (input: { xp: number; currency: number; streak: number }) => void;
  setGachaState: (state: GachaState) => void;
  applyGachaPull: (result: GachaPullResponse) => void;
  applyAttemptResult: (input: {
    lessonId: number;
    gainedXp: number;
    gainedCurrency: number;
    isCorrect: boolean;
    streakFromBackend?: number;
  }) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export function getRankFromXp(xp: number): string {
  const level = Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;
  if (level >= 20) {
    return "Director";
  }
  if (level >= 10) {
    return "Agent";
  }
  if (level >= 5) {
    return "Apprentice";
  }
  return "Fledgling";
}

export function getNextRankThreshold(xp: number): number {
  return Math.floor(Math.max(0, xp) / XP_PER_LEVEL + 1) * XP_PER_LEVEL;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      name: "",
      token: null,
      language: "en",
      xp: 0,
      currency: 0,
      streak: 0,
      lessonsCompleted: 0,
      lessons: [],
      gachaState: null,
      completedLessonIds: [],
      lastActiveDate: null,
      isGenerating: false,
      setSession: ({ name, token }) => {
        set({ name, token });
      },
      clearSession: () => {
        set({
          name: "",
          token: null,
          language: "en",
          xp: 0,
          currency: 0,
          streak: 0,
          lessonsCompleted: 0,
          lessons: [],
          gachaState: null,
          completedLessonIds: [],
          lastActiveDate: null,
          isGenerating: false
        });
      },
      setLanguage: (language) => set({ language }),
      setLessons: (lessons) => set({ lessons }),
      setGachaState: (gachaState) => set({ gachaState, currency: gachaState.currency }),
      applyGachaPull: (result) =>
        set({
          gachaState: result.state,
          currency: result.state.currency
        }),
      upsertLesson: (lesson) => {
        const current = get().lessons;
        const existingIndex = current.findIndex((item) => item.id === lesson.id);
        if (existingIndex >= 0) {
          const copy = [...current];
          copy[existingIndex] = lesson;
          set({ lessons: copy });
          return;
        }
        set({ lessons: [lesson, ...current] });
      },
      setGenerating: (isGenerating) => set({ isGenerating }),
      hydrateProgress: ({ xp, currency, streak }) => set({ xp, currency, streak }),
      applyAttemptResult: ({ lessonId, gainedXp, gainedCurrency, isCorrect, streakFromBackend }) => {
        const state = get();
        const nowDay = today();
        let nextStreak = state.streak;

        if (typeof streakFromBackend === "number") {
          nextStreak = streakFromBackend;
        } else if (state.lastActiveDate === nowDay) {
          nextStreak = state.streak;
        } else if (state.lastActiveDate) {
          const previous = new Date(`${state.lastActiveDate}T00:00:00.000Z`);
          const current = new Date(`${nowDay}T00:00:00.000Z`);
          const diffDays = Math.round((current.getTime() - previous.getTime()) / 86_400_000);
          nextStreak = diffDays === 1 ? Math.max(1, state.streak + 1) : 1;
        } else {
          nextStreak = 1;
        }

        const completed = new Set(state.completedLessonIds);
        if (isCorrect) {
          completed.add(lessonId);
        }

        set({
          xp: state.xp + gainedXp,
          currency: state.currency + gainedCurrency,
          streak: nextStreak,
          lessonsCompleted: completed.size,
          completedLessonIds: [...completed],
          lastActiveDate: nowDay
        });
      }
    }),
    {
      name: "arlecchino-academy-store"
    }
  )
);

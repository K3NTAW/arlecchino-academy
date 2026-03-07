import { describe, expect, it } from "vitest";
import request from "supertest";
import { LessonBundleSchema } from "@academy/shared";
import { createApp } from "./app";
import type { AIProvider } from "./ai/provider";
import { env } from "./config";
import type { DatabaseService } from "./db";
import type { JavaEvaluator } from "./evaluator/java-evaluator";

const testProvider: AIProvider = {
  async generateLessonBundle() {
    return LessonBundleSchema.parse({
      lesson: {
        title: "Test lesson",
        summary: "Test summary",
        keyTerms: [{ term: "term", definition: "definition" }],
        insights: [{ headline: "headline", explanation: "explanation" }],
        language: "en"
      },
      challenges: [
        {
          id: "mcq-1",
          type: "mcq",
          question: "Q?",
          options: ["A", "B", "C", "D"],
          correctIndex: 0,
          explanation: "E",
          whyWrongExplanations: ["x", "y", "z"]
        }
      ]
    });
  }
};

const testGacha = {
  currency: 1600,
  pity4Counter: 0,
  pity5Counter: 0,
  guaranteedFeatured5Star: false,
  history: [] as Array<{
    item: { id: string; name: string; rarity: 3 | 4 | 5; featured: boolean; type: "character" };
    wasPity4: boolean;
    wasPity5: boolean;
    wasFeaturedGuarantee: boolean;
  }>
};

function gachaBanner() {
  return {
    id: "arlecchino-banner-v1",
    name: "Moment of Crimson Oath",
    featuredItemName: "Arlecchino",
    costPerPull: 160,
    rate3: 0.943,
    rate4: 0.051,
    rate5: 0.006,
    pity4: 10,
    pity5: 90
  };
}

function resetTestGacha(input: Partial<typeof testGacha> = {}) {
  testGacha.currency = input.currency ?? 1600;
  testGacha.pity4Counter = input.pity4Counter ?? 0;
  testGacha.pity5Counter = input.pity5Counter ?? 0;
  testGacha.guaranteedFeatured5Star = input.guaranteedFeatured5Star ?? false;
  testGacha.history = input.history ?? [];
}

const fakeDb = {
  async findLessonByHashAndLanguage() {
    return null;
  },
  async saveGeneratedLesson() {
    return { lessonId: 1 };
  },
  async getLessonById() {
    return {
      lesson: {
        id: 1,
        documentId: 1,
        title: "Test lesson",
        summary: "Test summary",
        keyTerms: [{ term: "term", definition: "definition" }],
        insights: [{ headline: "headline", explanation: "explanation" }],
        language: "en"
      },
      challenges: [
        {
          id: 10,
          lessonId: 1,
          type: "mcq",
          difficulty: "easy",
          payload: {
            type: "mcq",
            question: "Q?",
            options: ["A", "B", "C", "D"],
            correctIndex: 0,
            explanation: "Explanation that is long enough for validation pass in tests.",
            whyWrongExplanations: ["x", "y", "z"]
          }
        }
      ]
    };
  },
  async getDashboardStats() {
    return {
      xp: 0,
      currency: 0,
      documentCount: 0,
      masteryPercent: 0,
      streakDays: 0,
      level: "Fledgling",
      recentLesson: null,
      recentLessons: []
    };
  },
  async getStateSnapshot() {
    return {
      dashboard: {
        xp: 0,
        currency: 0,
        documentCount: 0,
        masteryPercent: 0,
        streakDays: 0,
        level: "Fledgling",
        recentLesson: null,
        recentLessons: []
      },
      progress: {
        xp: 0,
        currency: 0,
        level: "Fledgling",
        masteryPercent: 0,
        streakDays: 0,
        badges: ["Fledgling"],
        topics: [{ name: "Java Foundations", mastery: 0 }],
        xpToNextLevel: 100
      }
    };
  },
  async getLessons() {
    return {
      items: [],
      total: 0
    };
  },
  async getProgressStats() {
    return {
      xp: 0,
      currency: 0,
      level: "Fledgling",
      masteryPercent: 0,
      streakDays: 0,
      badges: ["Fledgling"],
      topics: [{ name: "Java Foundations", mastery: 0 }],
      xpToNextLevel: 100
    };
  },
  async getChallengeById(challengeId: number) {
    if (challengeId === 11) {
      return {
        id: 11,
        lessonId: 1,
        type: "coding",
        difficulty: "medium",
        payload: {
          id: "coding-1",
          type: "coding",
          question: "Read two integers and print their sum.",
          starterCode: "public class Main { public static void main(String[] args) {} }",
          solution:
            "import java.util.*; public class Main { public static void main(String[] args){ Scanner sc = new Scanner(System.in); int a=sc.nextInt(); int b=sc.nextInt(); System.out.print(a+b); } }",
          hint: "Use Scanner and print the sum.",
          ahaInsight: "The program is validated using stdin/stdout test cases.",
          testCases: [{ input: "2 2", expected: "4" }]
        }
      };
    }
    return {
      id: 10,
      lessonId: 1,
      type: "mcq",
      difficulty: "medium",
      payload: {
        id: "mcq-1",
        type: "mcq",
        question: "Which one is immutable?",
        options: ["String", "StringBuilder", "StringBuffer", "char[]"],
        correctIndex: 0,
        explanation: "String is immutable by design.",
        whyWrongExplanations: ["StringBuilder is mutable.", "StringBuffer is mutable.", "char[] is mutable."]
      }
    };
  },
  async saveAttempt() {
    return { gainedXp: 100, gainedCurrency: 25, totalXp: 100, totalCurrency: 25, level: "Apprentice", streakDays: 1 };
  },
  async getGachaState() {
    return {
      banner: gachaBanner(),
      currency: testGacha.currency,
      pity4Counter: testGacha.pity4Counter,
      pity5Counter: testGacha.pity5Counter,
      guaranteedFeatured5Star: testGacha.guaranteedFeatured5Star,
      history: testGacha.history
    };
  },
  async performGachaPull(count: 1 | 10) {
    const spentCurrency = 160 * count;
    if (testGacha.currency < spentCurrency) {
      throw new Error("Not enough Ember Coins.");
    }

    const pulls: typeof testGacha.history = [];
    for (let i = 0; i < count; i += 1) {
      const nextPity4 = testGacha.pity4Counter + 1;
      const nextPity5 = testGacha.pity5Counter + 1;
      const hitPity5 = nextPity5 >= 90;
      const hitPity4 = !hitPity5 && nextPity4 >= 10;

      let rarity: 3 | 4 | 5 = 3;
      if (hitPity5) {
        rarity = 5;
      } else if (hitPity4) {
        rarity = 4;
      }

      const pull = {
        item:
          rarity === 5
            ? {
                id: "arlecchino",
                name: "Arlecchino",
                rarity: 5 as const,
                featured: true,
                type: "character" as const
              }
            : rarity === 4
              ? {
                  id: "xiangling",
                  name: "Xiangling",
                  rarity: 4 as const,
                  featured: false,
                  type: "character" as const
                }
              : {
                  id: "slingshot",
                  name: "Slingshot",
                  rarity: 3 as const,
                  featured: false,
                  type: "character" as const
                },
        wasPity4: hitPity4,
        wasPity5: hitPity5,
        wasFeaturedGuarantee: rarity === 5 && testGacha.guaranteedFeatured5Star
      };

      pulls.push(pull);

      if (rarity === 5) {
        testGacha.pity4Counter = 0;
        testGacha.pity5Counter = 0;
        testGacha.guaranteedFeatured5Star = false;
      } else if (rarity === 4) {
        testGacha.pity4Counter = 0;
        testGacha.pity5Counter = nextPity5;
      } else {
        testGacha.pity4Counter = nextPity4;
        testGacha.pity5Counter = nextPity5;
      }
    }

    testGacha.currency -= spentCurrency;
    testGacha.history = [...pulls.slice().reverse(), ...testGacha.history].slice(0, 30);

    return {
      spentCurrency,
      pulls,
      state: {
        banner: gachaBanner(),
        currency: testGacha.currency,
        pity4Counter: testGacha.pity4Counter,
        pity5Counter: testGacha.pity5Counter,
        guaranteedFeatured5Star: testGacha.guaranteedFeatured5Star,
        history: testGacha.history
      }
    };
  }
} as unknown as DatabaseService;

const fakeJavaEvaluator: JavaEvaluator = {
  async evaluate() {
    return {
      isCorrect: true,
      testResults: [{ input: "2 2", expected: "4", actual: "4", passed: true }]
    };
  }
};

const app = createApp(testProvider, fakeDb, { javaEvaluator: fakeJavaEvaluator });

describe("backend app", () => {
  it("returns gacha state for authenticated user", async () => {
    resetTestGacha();
    const res = await request(app).get("/api/gacha/state").set("Authorization", `Bearer ${env.ACCESS_TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.banner.featuredItemName).toBe("Arlecchino");
  });

  it("returns health state", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("generates lesson bundle with injected provider", async () => {
    const res = await request(app)
      .post("/api/generate")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({
        extractedText: "Java variables store values.",
        language: "en"
      });

    expect(res.status).toBe(200);
    expect(res.body.lesson.title).toBeTypeOf("string");
    expect(Array.isArray(res.body.challenges)).toBe(true);
  });

  it("accepts upload and returns extraction payload", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .attach("pdf", Buffer.from("fake"), "sample.pdf");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("usedOcrFallback");
  });

  it("accepts DOCX upload and returns extraction payload", async () => {
    const res = await request(app)
      .post("/api/upload")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .attach("pdf", Buffer.from("fake-docx"), "sample.docx");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("text");
  });

  it("returns lesson details with full interactive challenges", async () => {
    const res = await request(app).get("/api/lessons/1").set("Authorization", `Bearer ${env.ACCESS_TOKEN}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.challenges)).toBe(true);
    expect(res.body.challenges[0]).toHaveProperty("question");
    expect(res.body.challenges[0]).toHaveProperty("options");
  });

  it("evaluates and records MCQ attempts through typed contract", async () => {
    const res = await request(app)
      .post("/api/challenges/10/attempt")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({
        type: "mcq",
        selectedIndex: 0
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.evaluation.type).toBe("mcq");
    expect(res.body.evaluation.correctIndex).toBe(0);
    expect(res.body.gainedCurrency).toBeGreaterThanOrEqual(0);
  });

  it("runs coding checks without awarding XP on check intent", async () => {
    const res = await request(app)
      .post("/api/challenges/11/attempt")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({
        type: "coding",
        code: "public class Main { public static void main(String[] args){ System.out.print(4); } }",
        intent: "check"
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.intent).toBe("check");
    expect(res.body.gainedXp).toBe(0);
    expect(res.body.gainedCurrency).toBe(0);
    expect(res.body.evaluation.type).toBe("coding");
    expect(Array.isArray(res.body.evaluation.testResults)).toBe(true);
  });

  it("rejects gacha pull when currency is insufficient", async () => {
    resetTestGacha({ currency: 100 });
    const res = await request(app)
      .post("/api/gacha/pull")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({ count: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Not enough Ember Coins");
  });

  it("triggers hard pity and returns a 5-star result", async () => {
    resetTestGacha({ currency: 1600, pity4Counter: 0, pity5Counter: 89 });
    const res = await request(app)
      .post("/api/gacha/pull")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({ count: 1 });

    expect(res.status).toBe(200);
    expect(res.body.pulls[0].item.rarity).toBe(5);
    expect(res.body.pulls[0].wasPity5).toBe(true);
  });

  it("applies featured guarantee when guarantee flag is set", async () => {
    resetTestGacha({ currency: 1600, pity4Counter: 0, pity5Counter: 89, guaranteedFeatured5Star: true });
    const res = await request(app)
      .post("/api/gacha/pull")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({ count: 1 });

    expect(res.status).toBe(200);
    expect(res.body.pulls[0].item.name).toBe("Arlecchino");
    expect(res.body.pulls[0].wasFeaturedGuarantee).toBe(true);
    expect(res.body.state.guaranteedFeatured5Star).toBe(false);
  });

  it("deducts currency and persists pull history between calls", async () => {
    resetTestGacha({ currency: 1600 });
    const pullRes = await request(app)
      .post("/api/gacha/pull")
      .set("Authorization", `Bearer ${env.ACCESS_TOKEN}`)
      .send({ count: 1 });
    expect(pullRes.status).toBe(200);
    expect(pullRes.body.spentCurrency).toBe(160);

    const stateRes = await request(app).get("/api/gacha/state").set("Authorization", `Bearer ${env.ACCESS_TOKEN}`);
    expect(stateRes.status).toBe(200);
    expect(stateRes.body.currency).toBe(1440);
    expect(stateRes.body.history.length).toBeGreaterThan(0);
  });
});

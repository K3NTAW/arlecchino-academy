import { describe, expect, it } from "vitest";
import { normalizeLessonBundleShape } from "./provider";

describe("normalizeLessonBundleShape", () => {
  it("converts string keyTerms and insights into object arrays", () => {
    const normalized = normalizeLessonBundleShape({
      lesson: {
        title: "t",
        summary: "s",
        language: "en",
        keyTerms: ["String: immutable text", "Pooling"],
        insights: ["Immutability: creates new object"]
      },
      challenges: []
    }) as {
      lesson: {
        keyTerms: Array<{ term: string; definition: string }>;
        insights: Array<{ headline: string; explanation: string }>;
      };
    };

    expect(normalized.lesson.keyTerms[0]).toEqual({
      term: "String",
      definition: "immutable text"
    });
    expect(normalized.lesson.keyTerms[1].term).toBe("Pooling");
    expect(normalized.lesson.insights[0].headline).toBe("Immutability");
  });

  it("fills missing challenge fields to match strict schema", () => {
    const normalized = normalizeLessonBundleShape({
      lesson: {
        title: "Java strings",
        summary: "Summary",
        language: "en",
        keyTerms: [{ term: "String", definition: "text object" }],
        insights: [{ headline: "Immutability", explanation: "new object created" }]
      },
      challenges: [
        {
          question: "Pick the best answer",
          options: ["A", "B", "C"]
        },
        {
          question: "Write code",
          solution: "print('x')"
        }
      ]
    }) as {
      challenges: Array<Record<string, unknown>>;
    };

    expect(normalized.challenges[0].type).toBe("mcq");
    expect(normalized.challenges[0]).toHaveProperty("correctIndex");
    expect(normalized.challenges[0]).toHaveProperty("whyWrongExplanations");

    expect(normalized.challenges[1].type).toBe("coding");
    expect(normalized.challenges[1]).toHaveProperty("starterCode");
    expect(normalized.challenges[1]).toHaveProperty("hint");
    expect(normalized.challenges[1]).toHaveProperty("ahaInsight");
    expect(normalized.challenges[1]).toHaveProperty("testCases");
    expect((normalized.challenges[1].testCases as unknown[]).length).toBeGreaterThanOrEqual(2);
  });

  it("replaces placeholder coding test cases with concrete variants", () => {
    const normalized = normalizeLessonBundleShape({
      lesson: {
        title: "String combine",
        summary: "Summary",
        language: "en",
        keyTerms: [{ term: "String", definition: "text object" }],
        insights: [{ headline: "Concat", explanation: "combine strings" }]
      },
      challenges: [
        {
          type: "coding",
          question: "Combine two strings. Input: two strings. Output: combined string.",
          starterCode: "class Main {}",
          solution: "class Main {}",
          hint: "Use +",
          ahaInsight: "Concatenation",
          testCases: [{ input: "example", expected: "example" }]
        }
      ]
    }) as {
      challenges: Array<{ testCases: Array<{ input: string; expected: string }> }>;
    };

    const testCases = normalized.challenges[0].testCases;
    expect(testCases.length).toBeGreaterThanOrEqual(2);
    expect(new Set(testCases.map((tc) => tc.input.trim())).size).toBeGreaterThanOrEqual(2);
    expect(testCases.every((tc) => tc.input.trim().length > 0 && tc.expected.trim().length > 0)).toBe(true);
  });
});

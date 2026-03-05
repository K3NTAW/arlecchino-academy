import { describe, expect, it } from "vitest";
import { LessonBundleSchema } from "./index";

describe("LessonBundleSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = LessonBundleSchema.safeParse({
      lesson: {
        title: "Variables in Java",
        summary: "Intro summary",
        keyTerms: [{ term: "variable", definition: "stores data" }],
        insights: [{ headline: "aha", explanation: "scope matters" }],
        language: "en"
      },
      challenges: [
        {
          id: "c1",
          type: "mcq",
          question: "What stores data?",
          options: ["variable", "class", "loop", "comment"],
          correctIndex: 0,
          explanation: "A variable stores values.",
          whyWrongExplanations: ["No", "No", "No"]
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { LocalJavaEvaluator } from "./java-evaluator";

function hasJavac(): boolean {
  const result = spawnSync("javac", ["-version"], { encoding: "utf8" });
  return result.status === 0 || result.stderr.includes("javac");
}

const describeIfJavac = hasJavac() ? describe : describe.skip;

describeIfJavac("LocalJavaEvaluator", () => {
  it("executes submissions with non-Main public class names", async () => {
    const evaluator = new LocalJavaEvaluator();
    const result = await evaluator.evaluate({
      code: `
public class StringConnector {
  public static void main(String[] args) {
    System.out.print("Hello");
  }
}
      `,
      testCases: [{ input: "", expected: "Hello" }]
    });

    expect(result.isCorrect).toBe(true);
    expect(result.testResults[0].passed).toBe(true);
  });

  it("returns explicit mismatch diagnostics for expected vs actual output", async () => {
    const evaluator = new LocalJavaEvaluator();
    const result = await evaluator.evaluate({
      code: `
public class Main {
  public static void main(String[] args) {
    System.out.print("Wrong");
  }
}
      `,
      testCases: [{ input: "", expected: "Right" }]
    });

    expect(result.isCorrect).toBe(false);
    expect(result.testResults[0].passed).toBe(false);
    expect(result.testResults[0].error).toContain("Output mismatch");
  });
});

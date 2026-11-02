import { afterEach, describe, expect, it } from "vitest";
import { calculateCost } from "./costTracker.js";

describe("Cost Tracker", () => {
  const originalInputPrice = process.env.GROQ_INPUT_PRICE_PER_MILLION;
  const originalOutputPrice = process.env.GROQ_OUTPUT_PRICE_PER_MILLION;

  afterEach(() => {
    if (originalInputPrice === undefined) {
      delete process.env.GROQ_INPUT_PRICE_PER_MILLION;
    } else {
      process.env.GROQ_INPUT_PRICE_PER_MILLION = originalInputPrice;
    }

    if (originalOutputPrice === undefined) {
      delete process.env.GROQ_OUTPUT_PRICE_PER_MILLION;
    } else {
      process.env.GROQ_OUTPUT_PRICE_PER_MILLION = originalOutputPrice;
    }
  });

  it("should calculate input, output and total cost correctly", () => {
    process.env.GROQ_INPUT_PRICE_PER_MILLION = "0.15";
    process.env.GROQ_OUTPUT_PRICE_PER_MILLION = "0.60";

    const result = calculateCost({
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    });

    expect(result.inputCost).toBeCloseTo(0.00015);
    expect(result.outputCost).toBeCloseTo(0.0003);
    expect(result.totalCost).toBeCloseTo(0.00045);
    expect(result.currency).toBe("USD");
  });

  it("should return zero cost when token usage is zero", () => {
    process.env.GROQ_INPUT_PRICE_PER_MILLION = "0.15";
    process.env.GROQ_OUTPUT_PRICE_PER_MILLION = "0.60";

    const result = calculateCost({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });

    expect(result.totalCost).toBe(0);
  });
});
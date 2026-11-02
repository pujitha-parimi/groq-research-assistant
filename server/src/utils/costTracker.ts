
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface CostResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
}

export function calculateCost(usage: TokenUsage): CostResult {
  // Configure these rates using the selected Groq model's
  // current official pricing (USD per 1 million tokens).
  const INPUT_PRICE_PER_MILLION = Number(
    process.env.GROQ_INPUT_PRICE_PER_MILLION ?? 0
  );

  const OUTPUT_PRICE_PER_MILLION = Number(
    process.env.GROQ_OUTPUT_PRICE_PER_MILLION ?? 0
  );

  const inputCost =
    (usage.promptTokens / 1_000_000) * INPUT_PRICE_PER_MILLION;

  const outputCost =
    (usage.completionTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: "USD",
  };
}

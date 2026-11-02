
# API Cost Analysis Report

## 1. Overview

The AI Research Assistant uses the Groq API to generate research answers and execute tool-calling workflows.

This report estimates API costs using token usage and configured model pricing.

## 2. Model and Pricing Configuration

Model: openai/gpt-oss-120b

| Token Type | Price per 1 Million Tokens |
|---|---:|
| Input Tokens | $0.15 |
| Cached Input Tokens | $0.075 |
| Output Tokens | $0.60 |

Pricing should be rechecked against the provider's current pricing before presenting this report.

## 3. Cost Calculation

Input Cost = Input Tokens × Input Price / 1,000,000

Output Cost = Output Tokens × Output Price / 1,000,000

Total Cost = Input Cost + Output Cost

Cached input tokens receive the configured 50% input-price discount when reported by the API.

## 4. Observed Test Result

Example values from a frontend test:

| Metric | Value |
|---|---:|
| Prompt Tokens | 4,975 |
| Completion Tokens | 1,474 |
| Total Tokens | 6,449 |
| Input Cost | $0.00068865 |
| Output Cost | $0.00088440 |
| Total Estimated Cost | $0.00157305 |

## 5. Cost Monitoring

The application:
- Tracks prompt and completion tokens.
- Estimates input and output costs.
- Accounts for reported cached tokens.
- Displays estimated total cost in the frontend.

## 6. Limitations

- Costs are estimates based on configured pricing.
- Actual provider billing may vary.
- Tool-calling workflows can make multiple model requests.
- All model requests in the agent loop should be included in usage totals.

## 7. Conclusion

The application provides token-level usage tracking and estimated API cost monitoring to help understand research request expenses.

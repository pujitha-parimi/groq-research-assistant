
# Prompt Cache Performance Report

## 1. Overview

This report describes prompt cache metrics collected by the AI Research Assistant using the Groq API.

The application reads cached token information from the model API usage response.

## 2. Metrics Collected

- Total prompt tokens
- Cached tokens
- Cache miss tokens
- Cache hit rate

## 3. Cache Hit Rate Calculation

Cache Hit Rate = (Cached Tokens / Prompt Tokens) × 100

## 4. Observed Test Result

The following values are from one application test displayed in the frontend:

| Metric | Observed Value |
|---|---:|
| Prompt Tokens | 4,975 |
| Cached Tokens | 768 |
| Cache Miss Tokens | 4,207 |
| Cache Hit Rate | 15.44% |

These values represent one observed request, not the overall project performance.

## 5. Interpretation

- The API reported 768 cached tokens.
- The remaining 4,207 prompt tokens were cache misses.
- The observed cache hit rate was 15.44%.
- Cache hits depend on matching prompt prefixes and provider-side caching behavior.

## 6. Limitations

- Cache hits are not guaranteed for every request.
- Results can vary across queries and repeated requests.
- A single test is not sufficient to establish long-term cache performance.
- The assignment target of greater than 70% has not yet been demonstrated.

## 7. Conclusion

The application collects and displays prompt caching metrics reported by Groq. Further repeated testing is required to evaluate whether the cache hit rate can reach the assignment target.

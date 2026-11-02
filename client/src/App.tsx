
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

interface ResearchResult {
  answer: string;
  toolsUsed: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cache: {
    cachedTokens: number;
    cacheMissTokens: number;
    cacheHitRate: number;
  };
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };
}

function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!question.trim() || loading) {
      if (!question.trim()) {
        setError("Please enter a research question.");
      }
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data as ResearchResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearQuestion = () => {
    setQuestion("");
    setResult(null);
    setError("");
  };

  return (
    <main className="app">
      <header className="header">
        <h1>AI Research Assistant</h1>
        <p>
          Your AI-powered research partner. Ask questions and get
          intelligent answers using multiple research tools.
        </p>
      </header>

      <section className="search-section">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
          placeholder="Ask your research question here..."
          rows={5}
          disabled={loading}
        />

        <div className="button-group">
          <button
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
          >
            {loading ? "Researching..." : "Ask AI"}
          </button>

          <button
            type="button"
            onClick={clearQuestion}
            disabled={loading || (!question && !result && !error)}
            className="clear-button"
          >
            Clear
          </button>
        </div>

        <small>Tip: Press Ctrl + Enter to submit your question.</small>
      </section>

      {loading && (
        <div className="loading">
          Researching your question. Please wait...
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <section className="results">
          {/* Research Answer */}
          <div className="answer">
            <h2>Research Answer</h2>

            <div className="answer-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.answer.replace(/<br\s*\/?>/gi, "\n")}
              </ReactMarkdown>
            </div>
          </div>

          {/* Tools Used */}
          <div className="tools-section">
            <h2>Tools Used</h2>

            <div className="tool-list">
              {result.toolsUsed.length > 0 ? (
                result.toolsUsed.map((tool, index) => (
                  <span
                    className="tool-badge"
                    key={`${tool}-${index}`}
                  >
                    {tool.replaceAll("_", " ")}
                  </span>
                ))
              ) : (
                <p>No tools were used for this query.</p>
              )}
            </div>
          </div>

          {/* Token Usage */}
          <div className="metrics-section">
            <h2>Token Usage</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Prompt Tokens</h3>
                <p>
                  {result.usage.promptTokens.toLocaleString()}
                </p>
              </div>

              <div className="metric-card">
                <h3>Completion Tokens</h3>
                <p>
                  {result.usage.completionTokens.toLocaleString()}
                </p>
              </div>

              <div className="metric-card">
                <h3>Total Tokens</h3>
                <p>
                  {result.usage.totalTokens.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Prompt Cache Performance */}
          <div className="cache-section">
            <h2>Prompt Cache Performance</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Cached Tokens</h3>
                <p>
                  {result.cache.cachedTokens.toLocaleString()}
                </p>
              </div>

              <div className="metric-card">
                <h3>Cache Miss Tokens</h3>
                <p>
                  {result.cache.cacheMissTokens.toLocaleString()}
                </p>
              </div>

              <div className="metric-card">
                <h3>Cache Hit Rate</h3>
                <p>{result.cache.cacheHitRate}%</p>
              </div>
            </div>

            <small>
              Cache performance is based on cached tokens reported by Groq.
              Cache hits are not guaranteed for every request.
            </small>
          </div>

          {/* Estimated API Cost */}
          <div className="cost-section">
            <h2>Estimated API Cost</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Input Cost</h3>
                <p>
                  ${result.cost.inputCost.toFixed(8)}
                </p>
              </div>

              <div className="metric-card">
                <h3>Output Cost</h3>
                <p>
                  ${result.cost.outputCost.toFixed(8)}
                </p>
              </div>

              <div className="metric-card">
                <h3>Total Cost</h3>
                <p>
                  ${result.cost.totalCost.toFixed(8)}
                </p>
              </div>
            </div>

            <small>
              Estimated cost in USD, based on configured model pricing.
              Actual billing may vary.
            </small>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;

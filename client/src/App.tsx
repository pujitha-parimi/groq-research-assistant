
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./App.css";

interface ResearchResult {
  answer: string;
  toolsUsed: string[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cache?: {
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) {
      setError("Please enter a research question.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setResult(null);
    setError("");
    setCopiedCode(null);

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

      if (
        typeof data.answer !== "string" ||
        !data.usage ||
        !data.cost
      ) {
        throw new Error("The backend returned an invalid response.");
      }

      setResult(data as ResearchResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to the backend server."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearQuestion = () => {
    setQuestion("");
    setResult(null);
    setError("");
    setCopiedCode(null);
  };

  const cache = result?.cache ?? {
    cachedTokens: 0,
    cacheMissTokens: 0,
    cacheHitRate: 0,
  };

  const formattedAnswer =
    result?.answer.replace(/<br\s*\/?>/gi, "\n") ?? "";

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setError("Unable to copy code. Please select and copy it manually.");
    }
  };

  return (
    <main className="app">
      <header className="header">
        <div className="header-icon">✦</div>

        <h1>AI Research Assistant</h1>

        <p>
          Your AI-powered research partner. Ask questions and get
          intelligent answers using multiple research tools.
        </p>
      </header>

      <section className="search-section">
        <label htmlFor="research-question">
          Enter your research question
        </label>

        <textarea
          id="research-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              handleSubmit();
            }
          }}
          placeholder="Example: Explain RAG architecture with a Python code example..."
          rows={5}
          disabled={loading}
        />

        <div className="button-group">
          <button
            type="button"
            className="ask-button"
            onClick={handleSubmit}
            disabled={loading || !question.trim()}
          >
            {loading ? "Researching..." : "Ask AI"}
          </button>

          <button
            type="button"
            className="clear-button"
            onClick={clearQuestion}
            disabled={loading || (!question && !result && !error)}
          >
            Clear
          </button>
        </div>

        <small>Tip: Press Ctrl + Enter to submit your question.</small>
      </section>

      {loading && (
        <div className="loading" role="status" aria-live="polite">
          <span className="loading-spinner" />
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
          <div className="answer">
            <div className="section-heading">
              <h2>Research Answer</h2>
              <span className="answer-label">AI Generated</span>
            </div>

            <div className="answer-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table({ children, ...props }) {
                    return (
                      <div className="table-wrapper">
                        <table {...props}>{children}</table>
                      </div>
                    );
                  },

                  pre({ children }) {
                    return <>{children}</>;
                  },

                  code({ className, children, ...props }) {
                    const codeText = String(children).replace(/\n$/, "");

                    const languageMatch = /language-([\w+-]+)/.exec(
                      className || ""
                    );

                    const isBlock =
                      Boolean(languageMatch) ||
                      String(children).includes("\n");

                    if (!isBlock) {
                      return (
                        <code className="inline-code" {...props}>
                          {children}
                        </code>
                      );
                    }

                    const language = languageMatch?.[1] || "text";

                    return (
                      <div className="code-block-wrapper">
                        <div className="code-language">
                          <span>{language.toUpperCase()}</span>

                          <button
                            type="button"
                            className="copy-code-button"
                            onClick={() => copyCode(codeText)}
                          >
                            {copiedCode === codeText ? "Copied!" : "Copy code"}
                          </button>
                        </div>

                        <SyntaxHighlighter
                          language={language}
                          style={oneDark}
                          PreTag="div"
                          showLineNumbers
                          wrapLongLines={false}
                          customStyle={{
                            margin: 0,
                            padding: "20px",
                            borderRadius: "0 0 10px 10px",
                            fontSize: "14px",
                            lineHeight: "1.8",
                            background: "#111827",
                            overflowX: "auto",
                          }}
                          codeTagProps={{
                            style: {
                              fontFamily: "Consolas, monospace",
                            },
                          }}
                        >
                          {codeText}
                        </SyntaxHighlighter>
                      </div>
                    );
                  },
                }}
              >
                {formattedAnswer}
              </ReactMarkdown>
            </div>
          </div>

          <div className="tools-section">
            <h2>Tools Used</h2>

            <div className="tool-list">
              {result.toolsUsed?.length > 0 ? (
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

          <div className="metrics-section">
            <h2>Token Usage</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Prompt Tokens</h3>
                <p>{result.usage.promptTokens.toLocaleString()}</p>
              </div>

              <div className="metric-card">
                <h3>Completion Tokens</h3>
                <p>{result.usage.completionTokens.toLocaleString()}</p>
              </div>

              <div className="metric-card">
                <h3>Total Tokens</h3>
                <p>{result.usage.totalTokens.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="cache-section">
            <h2>Prompt Cache Performance</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Cached Tokens</h3>
                <p>{cache.cachedTokens.toLocaleString()}</p>
              </div>

              <div className="metric-card">
                <h3>Cache Miss Tokens</h3>
                <p>{cache.cacheMissTokens.toLocaleString()}</p>
              </div>

              <div className="metric-card">
                <h3>Cache Hit Rate</h3>
                <p>{cache.cacheHitRate}%</p>
              </div>
            </div>

            <small>
              Cache metrics are based on usage information returned by
              Groq. Cache hits are not guaranteed for every request.
            </small>
          </div>

          <div className="cost-section">
            <h2>Estimated API Cost</h2>

            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Input Cost</h3>
                <p>${result.cost.inputCost.toFixed(8)}</p>
              </div>

              <div className="metric-card">
                <h3>Output Cost</h3>
                <p>${result.cost.outputCost.toFixed(8)}</p>
              </div>

              <div className="metric-card">
                <h3>Total Cost</h3>
                <p>${result.cost.totalCost.toFixed(8)}</p>
              </div>
            </div>

            <small>
              Estimated cost in {result.cost.currency}, based on configured
              model pricing. Actual billing may vary.
            </small>
          </div>
        </section>
      )}
    </main>
  );
}

export default App;

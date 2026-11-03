
import "dotenv/config";
import Groq from "groq-sdk";

import { webSearch } from "./tools/webSearch.js";
import { knowledgeLookup } from "./tools/knowledgeLookup.js";
import { databaseQuery } from "./tools/databaseQuery.js";
import { calculateCost } from "./utils/costTracker.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "openai/gpt-oss-120b";
const MAX_STEPS = 5;

const SYSTEM_PROMPT = `
You are an accurate AI Research Assistant.

Your job is to answer research questions using the available tools:
1. web_search
2. knowledge_lookup
3. database_query

RESEARCH RULES:
- Understand the user's question before answering.
- Use the available tools when external information, stored knowledge, or database records are relevant.
- You may call multiple tools when necessary.
- Never invent facts, sources, statistics, or references.
- Use information returned by tools as evidence.
- If the available information is insufficient, clearly state that.
- Do not claim that a tool was used unless it was actually called.
- Provide a clear, structured answer.
- Avoid unnecessary repetition.

STRICT MARKDOWN FORMATTING RULES:

1. GENERAL FORMATTING
- Use Markdown headings to organize long answers.
- Use bullet points for lists of related information.
- Use numbered lists for sequential steps or processes.
- Use bold text only for important terms and key points.
- Keep paragraphs short and readable.

2. TABLE CREATION
- Use a Markdown table when the user asks for a comparison, differences, features, advantages, disadvantages, or structured data.
- Do not create a table when normal paragraphs or bullet points are more suitable.
- Every table MUST have a header row.
- Every header row MUST be followed immediately by a Markdown separator row.
- Use the pipe character (|) to separate columns.
- Every row MUST contain exactly the same number of columns.
- Keep table cells concise and easy to understand.
- Do not put multi-paragraph content inside table cells.
- Do not put nested Markdown tables inside table cells.
- Do not insert blank lines between table rows.
- Do not use HTML table tags.
- Do not put the entire table inside a code block.
- Do not write explanatory text in place of the actual table.
- Use a short heading before a table when appropriate.
- Add a short explanation after the table when useful.

3. CORRECT MARKDOWN TABLE STRUCTURE

Always follow this pattern:

| Aspect | Option A | Option B |
|---|---|---|
| Purpose | Description A | Description B |
| Main Feature | Feature A | Feature B |
| Advantage | Advantage A | Advantage B |
| Limitation | Limitation A | Limitation B |

4. TABLE QUALITY
- Keep column names short and meaningful.
- Keep each cell focused on one point.
- Use consistent terminology throughout the table.
- Do not leave unnecessary empty cells.
- If a table becomes too wide, simplify the columns or use bullet points instead.
- Never output a table with missing separator lines.
- Never output rows with a different number of columns.

5. SOURCES
- When web search results provide URLs, include relevant source links.
- Do not invent URLs or citations.
- Clearly distinguish tool-supported facts from information that could not be verified.

6. FINAL ANSWER
- Start with a direct answer or brief overview.
- Organize detailed information using suitable headings.
- Include a comparison table when the user explicitly requests one.
- End with a concise conclusion or key takeaway when appropriate.

IMPORTANT:
The final answer must be readable, factually accurate, and correctly formatted.
`;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description:
        "Search the web for current information related to a research question.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "knowledge_lookup",
      description:
        "Search the internal knowledge base for relevant information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The knowledge search query.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "database_query",
      description:
        "Search the research database for relevant stored records.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The database search query.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface CacheMetrics {
  cachedTokens: number;
  cacheMissTokens: number;
  cacheHitRate: number;
}

interface AgentResult {
  answer: string;
  toolsUsed: string[];
  usage: AgentUsage;
  cache: CacheMetrics;
  cost: {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
  };
}

async function executeTool(
  toolName: string,
  argumentsJson: string
): Promise<unknown> {
  let args: { query?: string };

  try {
    args = JSON.parse(argumentsJson) as { query?: string };
  } catch {
    throw new Error("Invalid JSON arguments received from the model.");
  }

  const query = args.query?.trim();

  if (!query) {
    throw new Error("A valid non-empty query is required.");
  }

  switch (toolName) {
    case "web_search":
      return await webSearch(query);

    case "knowledge_lookup":
      return knowledgeLookup(query);

    case "database_query":
      return databaseQuery(query);

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function runResearchAgent(
  question: string
): Promise<AgentResult> {
  if (!question || !question.trim()) {
    throw new Error("Please provide a valid research question.");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  // The message list contains the conversation and tool results.
  const messages: any[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: question.trim(),
    },
  ];

  const toolsUsed = new Set<string>();

  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;
  let cachedTokens = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      reasoning_effort: "medium",
    });

    // Add token usage from every model request in the agent loop.
    const usage = completion.usage as
      | {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          prompt_tokens_details?: {
            cached_tokens?: number;
          };
        }
      | undefined;

    promptTokens += usage?.prompt_tokens ?? 0;
    completionTokens += usage?.completion_tokens ?? 0;
    totalTokens += usage?.total_tokens ?? 0;

    cachedTokens +=
      usage?.prompt_tokens_details?.cached_tokens ?? 0;

    const assistantMessage = completion.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error("The AI model returned an empty response.");
    }

    // If there are no tool calls, the model has produced its final answer.
    if (
      !assistantMessage.tool_calls ||
      assistantMessage.tool_calls.length === 0
    ) {
      const answer = assistantMessage.content;

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("The AI model did not return a valid answer.");
      }

      const safeCachedTokens = Math.min(
        cachedTokens,
        promptTokens
      );

      const cacheMissTokens = Math.max(
        0,
        promptTokens - safeCachedTokens
      );

      const cacheHitRate =
        promptTokens > 0
          ? (safeCachedTokens / promptTokens) * 100
          : 0;

      // Groq GPT-OSS 120B cached input tokens have a 50% discount.
      // This calculation estimates the discounted input cost.
      const billablePromptTokens =
        promptTokens - safeCachedTokens * 0.5;

      const cost = calculateCost({
        promptTokens: billablePromptTokens,
        completionTokens,
        totalTokens,
      });

      return {
        answer,
        toolsUsed: Array.from(toolsUsed),

        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },

        cache: {
          cachedTokens: safeCachedTokens,
          cacheMissTokens,
          cacheHitRate: Number(cacheHitRate.toFixed(2)),
        },

        cost,
      };
    }

    // Add the assistant tool-call message to the conversation.
    messages.push(assistantMessage);

    // Execute every tool requested by the model.
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.type !== "function") {
        continue;
      }

      const toolName = toolCall.function.name;

      try {
        const toolResult = await executeTool(
          toolName,
          toolCall.function.arguments
        );

        toolsUsed.add(toolName);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Tool execution failed.";

        // Return the error to the model so it can continue safely.
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: errorMessage,
            tool: toolName,
          }),
        });
      }
    }
  }

  throw new Error(
    `The agent reached its maximum of ${MAX_STEPS} steps without producing a final answer.`
  );
}

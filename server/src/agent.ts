
import Groq from "groq-sdk";

import { webSearch } from "./tools/webSearch.js";
import { knowledgeLookup } from "./tools/knowledgeLookup.js";
import { databaseQuery } from "./tools/databaseQuery.js";
import { calculateCost } from "./utils/costTracker.js";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "openai/gpt-oss-120b";
const MAX_STEPS = 8;

// All tools accept exactly one required argument: query.
const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the internet for current information. You MUST provide a non-empty query string. Do not provide cursor, id, or other parameters.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A clear search query describing what information to find.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "knowledge_lookup",
      description:
        "Search the internal AI knowledge base. You MUST provide a non-empty query string.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The topic to find in the internal knowledge base.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "database_query",
      description:
        "Search stored research records. You MUST provide a non-empty query string.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The research topic to find in the database.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

interface ToolArguments {
  query: string;
}

function parseToolArguments(argumentsText: string): ToolArguments {
  let parsed: unknown;

  try {
    parsed = JSON.parse(argumentsText);
  } catch {
    throw new Error("The model returned invalid JSON tool arguments.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    throw new Error("Tool arguments must be a JSON object.");
  }

  const args = parsed as Record<string, unknown>;

  if (
    typeof args.query !== "string" ||
    !args.query.trim()
  ) {
    throw new Error("Tool arguments must contain a non-empty query.");
  }

  return {
    query: args.query.trim(),
  };
}

async function executeTool(
  name: string,
  query: string
): Promise<unknown> {
  if (typeof query !== "string" || !query.trim()) {
    throw new Error("Tool query must be a non-empty string.");
  }

  const cleanQuery = query.trim();

  switch (name) {
    case "web_search":
      return await webSearch(cleanQuery);

    case "knowledge_lookup":
      return knowledgeLookup(cleanQuery);

    case "database_query":
      return databaseQuery(cleanQuery);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function runResearchAgent(question: string) {
  if (!question || !question.trim()) {
    throw new Error("Please provide a research question.");
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("Groq API key is not configured.");
  }

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
You are an AI research assistant.

You have access to exactly three tools:

1. web_search
   Required argument: {"query": "your search topic"}

2. knowledge_lookup
   Required argument: {"query": "your knowledge topic"}

3. database_query
   Required argument: {"query": "your database search topic"}

IMPORTANT TOOL RULES:
- Always provide the required query argument when calling a tool.
- The query must be a non-empty string.
- Never send cursor, id, page, or other arguments.
- Use each available tool at most once for the current question.
- Do not repeat a tool call when its result is already available.
- When the relevant tool results are received, stop calling tools.
- Combine the available results and provide the final answer.
- Never continue searching unnecessarily.

ANSWER RULES:
- Base answers on tool results whenever available.
- Clearly distinguish sourced information from general knowledge.
- Use clear headings and bullet points.
- When creating tables, use valid GitHub Flavored Markdown.
- Put every table row on a separate line.
- Include a Markdown separator row after the table header.
- Do not use HTML tags inside tables.
- Keep answers accurate, clear, and well structured.
- Never invent sources or research findings.
      `,
    },
    {
      role: "user",
      content: question.trim(),
    },
  ];

  const toolCallsUsed: string[] = [];

  // Track usage across every model request.
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
      parallel_tool_calls: false,
      reasoning_effort: "medium",
    });

    const usage = completion.usage as unknown as
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
      throw new Error("The model returned an empty response.");
    }

    messages.push(assistantMessage);

    // If there are no tool calls, return the final answer.
    if (!assistantMessage.tool_calls?.length) {
      const safeCachedTokens = Math.min(
        cachedTokens,
        promptTokens
      );

      // Apply the configured 50% cached-input discount.
      const billableInputTokens =
        promptTokens - safeCachedTokens * 0.5;

      const cost = calculateCost({
        promptTokens: billableInputTokens,
        completionTokens,
        totalTokens,
      });

      const cacheHitRate =
        promptTokens > 0
          ? (safeCachedTokens / promptTokens) * 100
          : 0;

      return {
        answer: assistantMessage.content ?? "",
        toolsUsed: [...new Set(toolCallsUsed)],

        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
        },

        cache: {
          cachedTokens: safeCachedTokens,
          cacheMissTokens: promptTokens - safeCachedTokens,
          cacheHitRate: Number(cacheHitRate.toFixed(2)),
        },

        cost,
      };
    }

    // Execute tool calls one at a time.
    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;

      let toolResult: unknown;

      try {
        const args = parseToolArguments(
          toolCall.function.arguments
        );

        toolResult = await executeTool(
          toolName,
          args.query
        );

        toolCallsUsed.push(toolName);

        console.log(`Tool executed successfully: ${toolName}`);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown tool execution error.";

        console.error(
          `Tool execution failed (${toolName}):`,
          errorMessage
        );

        toolResult = {
          success: false,
          tool: toolName,
          error: errorMessage,
        };
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    }
  }

  throw new Error(
    `Agent reached the maximum limit of ${MAX_STEPS} tool-calling steps.`
  );
}

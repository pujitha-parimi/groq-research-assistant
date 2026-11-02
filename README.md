# AI Research Assistant

An AI-powered research assistant built using React, TypeScript, Node.js, Groq AI, and SQLite. It uses an agent-based tool-calling workflow to research questions using multiple information sources.

## Features

- Groq-powered AI research assistant.
- Three research tools:
  - **Web Search:** Retrieves supporting information from the internet using Tavily.
  - **Knowledge Lookup:** Searches the internal knowledge base.
  - **Database Query:** Searches stored SQLite research records.
- Agent loop for tool execution and final response generation.
- Reasoning effort configuration using a supported Groq model.
- Automatic prompt caching metrics reported by Groq.
- Token usage tracking across model requests.
- Estimated API cost calculation.
- Cache hit and cache miss tracking.
- React frontend with Markdown and table rendering.
- SQLite database for research records.
- Unit tests for cost calculation.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| AI Provider | Groq API |
| AI Model | openai/gpt-oss-120b |
| Web Search | Tavily API |
| Database | SQLite using sql.js |
| Validation | Zod |
| Testing | Vitest |
| Version Control | Git and GitHub |

## Architecture

```text
                  USER
                   |
                   v
          REACT FRONTEND
                   |
             HTTP Request
                   |
                   v
          NODE.JS BACKEND
                   |
                   v
            GROQ AI AGENT
                   |
          Tool Calling Loop
          /       |       \
         v        v        v
     Web Search Knowledge  Database
      (Tavily)   Lookup    Query
         \        |        /
          \       |       /
           v      v      v
           TOOL RESULTS
                   |
                   v
             GROQ AI MODEL
                   |
             FINAL ANSWER
                   |
                   v
             REACT UI
                   |
        Answer, Usage, Cost,
        Cache and Tool Metrics
```

## Project Structure

```text
groq-research-assistant/
│
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── db/
│   │   │   └── database.ts
│   │   ├── tools/
│   │   │   ├── webSearch.ts
│   │   │   ├── knowledgeLookup.ts
│   │   │   └── databaseQuery.ts
│   │   ├── utils/
│   │   │   ├── costTracker.ts
│   │   │   └── costTracker.test.ts
│   │   ├── agent.ts
│   │   └── index.ts
│   ├── .env
│   └── package.json
│
├── docs/
├── reports/
└── README.md
```

## Prerequisites

- Node.js and npm
- Groq API key
- Tavily API key
- Git

## Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd groq-research-assistant
```

### 2. Install frontend dependencies

```bash
cd client
npm install
npm install react-markdown remark-gfm
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server` folder.

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key

GROQ_INPUT_PRICE_PER_MILLION=0.15
GROQ_OUTPUT_PRICE_PER_MILLION=0.60
```

Replace the API key placeholders with your own keys. Never upload `.env` to GitHub.

## Running the Application

Open two terminals.

### Terminal 1: Start the backend

```bash
cd server
npm run dev
```

Backend URL:

`http://localhost:5000`

### Terminal 2: Start the frontend

```bash
cd client
npm run dev
```

Frontend URL:

`http://localhost:5173`

Open the frontend URL in your browser and enter a research question.

## API Endpoint

### POST `/api/chat`

Request:

```json
{
  "question": "Explain RAG, BM25 and Vector Search."
}
```

The backend processes the question using the AI agent and its available research tools.

The response includes the research answer, tools used, token usage and estimated API cost. Cache metrics are also reported when included by the backend.

## Research Tools

1. **Web Search:** Finds relevant information from online sources.
2. **Knowledge Lookup:** Retrieves information from the internal knowledge base.
3. **Database Query:** Searches research records stored in SQLite.

## Token Usage and Cost Tracking

The application tracks:

- Prompt tokens
- Completion tokens
- Total tokens
- Estimated input cost
- Estimated output cost
- Estimated total API cost

Costs are calculated using the configured model pricing and are estimates, not actual billing statements.

## Prompt Cache Monitoring

The application reports cache metrics returned by Groq:

- Cached tokens
- Cache miss tokens
- Cache hit rate

Prompt caching is handled automatically by the supported Groq model. Cache hits are not guaranteed for every request.

## Reasoning Configuration

The application uses the `reasoning_effort` configuration supported by the selected Groq model to control reasoning effort.

## Testing

Run backend unit tests:

```bash
cd server
npm test
```

Build the backend:

```bash
npm run build
```

## Important Provider Note

This project is a Groq-powered adaptation of the Claude-powered research assistant assignment.

It uses the Groq API instead of the Anthropic Messages API. Therefore, Groq reasoning and automatic prompt caching are used rather than Anthropic-specific extended thinking and `cache_control` features.

## Future Improvements

- Add structured JSON response validation.
- Add research history.
- Improve cache performance monitoring.
- Add more research tools.
- Improve frontend responsiveness and visual design.
- Add integration tests for the complete agent workflow.

## Author

Developed as an AI Agent and Forward Deployed Engineering learning project.
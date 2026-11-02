
# Sample Queries and Outputs

This document contains sample research questions used to test the AI Research Assistant.

## Query 1: Knowledge Base Lookup

**Question:**

Explain Retrieval-Augmented Generation (RAG) and its benefits.

**Expected tool:** knowledge_lookup

**What to verify:**
- The assistant explains RAG.
- Relevant internal knowledge is retrieved.
- The final answer is generated using the retrieved information.

## Query 2: Database Search

**Question:**

Find information about BM25 in the research database.

**Expected tool:** database_query

**What to verify:**
- The database tool executes successfully.
- Relevant research records are returned.
- The assistant summarizes the results.

## Query 3: Web Search

**Question:**

Find recent information about AI agents and their applications.

**Expected tool:** web_search

**What to verify:**
- The web search tool executes successfully.
- Relevant web results are retrieved.
- The answer uses the retrieved information.

## Query 4: Combined Research

**Question:**

Explain RAG, BM25, and Vector Search. Use all three available tools:
1. Search the internal knowledge base.
2. Search the research database.
3. Search the web for supporting information.

Combine the results and create a comparison table.

**Expected tools:**
- knowledge_lookup
- database_query
- web_search

**What to verify:**
- All three tools execute successfully.
- The assistant combines the retrieved information.
- The final answer contains a comparison table.

## Test Evidence

Actual application screenshots and API responses should be added here after testing.

| Test | Expected Result | Status |
|---|---|---|
| Knowledge lookup | Relevant knowledge retrieved | To verify |
| Database query | Relevant records retrieved | To verify |
| Web search | Online results retrieved | To verify |
| Combined research | All three tools used | To verify |


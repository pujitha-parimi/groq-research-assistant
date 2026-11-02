
export interface KnowledgeResult {
  topic: string;
  content: string;
}

const knowledgeBase: KnowledgeResult[] = [
  {
    topic: "RAG",
    content:
      "Retrieval-Augmented Generation (RAG) retrieves relevant external information and provides it to an AI model to generate grounded answers.",
  },
  {
    topic: "BM25",
    content:
      "BM25 is a keyword-based information retrieval algorithm used to rank documents according to their relevance to a search query.",
  },
  {
    topic: "Vector Database",
    content:
      "A vector database stores vector embeddings and helps retrieve semantically similar information.",
  },
  {
    topic: "AI Agents",
    content:
      "AI agents use language models, tools, and observations to perform tasks and solve problems.",
  },
  {
    topic: "Prompt Engineering",
    content:
      "Prompt engineering is the practice of designing instructions and context to guide an AI model's responses.",
  },
];

export function knowledgeLookup(query: string): KnowledgeResult[] {
  const searchTerms = query.toLowerCase().split(/\s+/);

  return knowledgeBase.filter((item) => {
    const searchableText = `${item.topic} ${item.content}`.toLowerCase();

    return searchTerms.some((term) =>
      searchableText.includes(term)
    );
  });
}

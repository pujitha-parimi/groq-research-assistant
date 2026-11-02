
import initSqlJs, { type Database } from "sql.js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export interface ResearchRecord {
  id: number;
  title: string;
  category: string;
  content: string;
}

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const dataDirectory = join(currentDirectory, "../../data");
const databasePath = join(dataDirectory, "research.db");

let database: Database | null = null;

function saveDatabase(): void {
  if (!database) {
    throw new Error("Database is not initialized.");
  }

  writeFileSync(databasePath, Buffer.from(database.export()));
}

export async function initializeDatabase(): Promise<void> {
  if (database) return;

  mkdirSync(dataDirectory, { recursive: true });

  const SQL = await initSqlJs({
    locateFile: (file) =>
      join(
        currentDirectory,
        "../../node_modules/sql.js/dist",
        file
      ),
  });

  if (existsSync(databasePath)) {
    database = new SQL.Database(readFileSync(databasePath));
  } else {
    database = new SQL.Database();
  }

  database.run(`
    CREATE TABLE IF NOT EXISTS research_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL
    )
  `);

  const result = database.exec(
    "SELECT COUNT(*) AS total FROM research_records"
  );

  const total = Number(result[0]?.values[0]?.[0] ?? 0);

  if (total === 0) {
    const insert = database.prepare(`
      INSERT INTO research_records (title, category, content)
      VALUES (?, ?, ?)
    `);

    const records = [
      [
        "Introduction to RAG",
        "AI",
        "RAG combines information retrieval with language generation to produce context-aware answers.",
      ],
      [
        "BM25 Algorithm",
        "Information Retrieval",
        "BM25 ranks documents based on keyword relevance and term frequency.",
      ],
      [
        "Vector Search",
        "AI",
        "Vector search retrieves information based on semantic similarity between embeddings.",
      ],
      [
        "AI Agents",
        "AI",
        "AI agents use models and tools to complete tasks through multiple steps.",
      ],
    ];

    for (const record of records) {
      insert.run(record);
    }

    insert.free();
  }

  saveDatabase();

  console.log("SQLite database initialized successfully.");
}

export function searchResearchRecords(
  query: string
): ResearchRecord[] {
  if (!database) {
    throw new Error("Database is not initialized.");
  }

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) {
    return [];
  }

  const conditions = terms
    .map(
      () =>
        "(LOWER(title) LIKE ? OR LOWER(category) LIKE ? OR LOWER(content) LIKE ?)"
    )
    .join(" OR ");

  const sql = `
    SELECT id, title, category, content
    FROM research_records
    WHERE ${conditions}
    ORDER BY id
    LIMIT 20
  `;

  const values = terms.flatMap((term) => [
    `%${term}%`,
    `%${term}%`,
    `%${term}%`,
  ]);

  const statement = database.prepare(sql);
  statement.bind(values);

  const records: ResearchRecord[] = [];

  while (statement.step()) {
  const row = statement.getAsObject();

  records.push({
    id: Number(row.id),
    title: String(row.title ?? ""),
    category: String(row.category ?? ""),
    content: String(row.content ?? ""),
  });
}

  statement.free();

  return records;
}

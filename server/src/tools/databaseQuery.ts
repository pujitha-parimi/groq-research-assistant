
import { searchResearchRecords } from "../db/database.js";

export interface ResearchRecord {
  id: number;
  title: string;
  category: string;
  content: string;
}

export function databaseQuery(query: string): ResearchRecord[] {
  if (!query || !query.trim()) {
    return [];
  }

  return searchResearchRecords(query.trim());
}

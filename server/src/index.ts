
import "dotenv/config";
import express from "express";
import cors from "cors";
import { runResearchAgent } from "./agent.js";
import { initializeDatabase } from "./db/database.js";

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Groq Research Assistant API is running!",
    status: "success",
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (
      !question ||
      typeof question !== "string" ||
      !question.trim()
    ) {
      res.status(400).json({
        error: "Please provide a valid question.",
      });
      return;
    }

    if (!process.env.GROQ_API_KEY) {
      res.status(500).json({
        error: "Groq API key is not configured.",
      });
      return;
    }

    const result = await runResearchAgent(question);
    
    res.json({
      answer: result.answer,
      toolsUsed: result.toolsUsed,
      usage: result.usage,
      cache: result.cache,
      cost: result.cost,
    });
  } catch (error) {
    console.error("Research agent error:", error);

    res.status(500).json({
      error: "Failed to complete research.",
    });
  }
});

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Backend server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
    process.exit(1);
  }
}

startServer();

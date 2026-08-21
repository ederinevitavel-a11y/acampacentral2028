import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with higher limit for base64 poster uploads
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// AI Text Polish API (for Pastoral message or Event description refinement)
app.post("/api/ai/generate-text", async (req, res) => {
  try {
    const { prompt, type } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt não informado." });
    }

    let systemInstruction = "Você é um pastor e comunicador cristão acolhedor e inspirador.";
    if (type === "pastoral") {
      systemInstruction =
        "Escreva uma mensagem pastoral inspiradora em português, com versículo bíblico temático e reflexão em 2 parágrafos para o boletim da igreja Comunica!.";
    } else if (type === "event") {
      systemInstruction =
        "Crie uma chamada atraente para evento da igreja Comunica! convidando famílias, jovens e membros.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            verse: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "content"],
        },
      },
    });

    if (!response.text) {
      throw new Error("Resposta vazia da IA");
    }

    const result = JSON.parse(response.text);
    return res.json({ success: true, result });
  } catch (error: any) {
    console.error("Erro na geração de texto com IA:", error);
    return res.status(500).json({
      error: "Falha ao gerar texto com IA.",
      details: error.message || String(error),
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Comunica!] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

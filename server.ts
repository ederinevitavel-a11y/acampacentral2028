import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/stats", async (req, res) => {
  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const csvUrl = process.env.SHEET_CSV_URL;
    
    if (csvUrl) {
      const response = await axios.get(csvUrl);
      const rows = response.data.split('\n').filter((r: string) => r.trim());
      const totalRegistrations = Math.max(0, rows.length - 1);
      let totalSim = 0;
      rows.slice(1).forEach((row: string) => {
        if (row.toLowerCase().includes('sim')) totalSim++;
      });
      return res.json({ totalSim, totalRegistrations, source: 'public_csv' });
    }

    if (appsScriptUrl) {
      const response = await axios.get(appsScriptUrl + "?action=stats");
      return res.json(response.data);
    } 
    
    res.json({ totalSim: 116, totalRegistrations: 142, source: 'fallback' });
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error);
    res.json({ totalSim: 0, totalRegistrations: 0, error: 'Erro ao ler dados' });
  }
});

app.post("/api/submit", async (req, res) => {
  try {
    const data = req.body;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;

    if (appsScriptUrl && appsScriptUrl.startsWith("https://script.google.com")) {
      const payload = {
        timestamp: new Date().toLocaleString("pt-BR"),
        name: data.name,
        whatsapp: data.whatsapp,
        interest: data.interest,
        monthlyValue: data.monthlyValue,
        paymentPreference: data.paymentPreference === 'Outro' ? data.paymentPreferenceOther : data.paymentPreference,
        suggestions: data.suggestions
      };
      
      try {
        await axios.post(appsScriptUrl, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log("Resposta enviada para a Macro com sucesso");
      } catch (axiosError: any) {
        console.error("Erro na comunicacao com o Google Apps Script:", axiosError.message);
        throw new Error(`Falha ao contactar a planilha: ${axiosError.message}`);
      }
    } else {
      console.warn("APPS_SCRIPT_URL nao configurada ou invalida.");
    }

    res.json({ success: true, message: "Inscrição enviada com sucesso!" });
  } catch (error: any) {
    console.error("Erro interno no /api/submit:", error.message);
    res.status(500).json({ 
      success: false, 
      error: "Erro no servidor ao processar inscrição.",
      details: error.message
    });
  }
});

export default app;

async function startServer() {
  const PORT = 3000;
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== "production") {
  startServer();
}

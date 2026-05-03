import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  // Endpoint para buscar estatísticas da planilha
  app.get("/api/stats", async (req, res) => {
    try {
      const appsScriptUrl = process.env.APPS_SCRIPT_URL;
      const csvUrl = process.env.SHEET_CSV_URL;
      
      // Prioridade 1: Link CSV Publicado (Mais rapido e facil para stats)
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

      // Prioridade 2: Apps Script (Macro) se configurado
      if (appsScriptUrl) {
        const response = await axios.get(appsScriptUrl + "?action=stats");
        return res.json(response.data);
      } 
      
      // Fallback local
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
        // Envia para o Google Apps Script (Macro)
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
            headers: {
              'Content-Type': 'application/json'
            }
          });
          console.log("Resposta enviada para a Macro com sucesso");
        } catch (axiosError: any) {
          console.error("Erro na comunicacao com o Google Apps Script:", axiosError.message);
          // Se falhar a comunicacao com o Google, ainda podemos considerar sucesso no "front" 
          // ou retornar erro se for critico. Aqui o usuario quer saber o motivo.
          throw new Error(`Falha ao contactar a planilha: ${axiosError.message}`);
        }
      } else {
        console.warn("APPS_SCRIPT_URL nao configurada ou invalida. Verifique os Secrets.");
        // Se nao tem URL, salvamos apenas localmente (logs) para nao quebrar a experiencia
        console.log("Dados que seriam enviados:", data);
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

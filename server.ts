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
      if (appsScriptUrl) {
        const response = await axios.get(appsScriptUrl + "?action=stats");
        res.json(response.data);
      } else {
        // Fallback local se não houver URL configurada
        res.json({ 
          totalSim: 116, 
          totalRegistrations: 142 
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      res.json({ totalSim: 0, totalRegistrations: 0 });
    }
  });

  app.post("/api/submit", async (req, res) => {
    try {
      const data = req.body;
      const appsScriptUrl = process.env.APPS_SCRIPT_URL;

      if (appsScriptUrl) {
        // Envia para o Google Apps Script (Macro)
        // Mapeia os dados para serem facilmente processados pela macro
        const payload = {
          timestamp: new Date().toLocaleString("pt-BR"),
          name: data.name,
          whatsapp: data.whatsapp,
          interest: data.interest,
          monthlyValue: data.monthlyValue,
          paymentPreference: data.paymentPreference === 'Outro' ? data.paymentPreferenceOther : data.paymentPreference,
          suggestions: data.suggestions
        };
        
        await axios.post(appsScriptUrl, payload);
        console.log("Resposta enviada para a Macro com sucesso");
      } else {
        console.warn("APPS_SCRIPT_URL nao encontrada no Secrets. Apenas logando os dados:");
        console.log("Form Data:", data);
      }

      res.json({ success: true, message: "Inscrição enviada com sucesso!" });
    } catch (error) {
      console.error("Erro ao enviar para Macro:", error);
      res.status(500).json({ success: false, error: "Erro ao processar sua inscrição via Macro." });
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

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

  // API Routes (Simulando o comportamento do Vercel localmente)
  app.get("/api/stats", async (req, res) => {
    try {
      const appsScriptUrl = process.env.APPS_SCRIPT_URL;
      const csvUrl = process.env.SHEET_CSV_URL;
      
      if (csvUrl) {
        const response = await axios.get(csvUrl);
        const rows = response.data.split(/\r?\n/).filter((r: string) => r.trim());
        
        let validCount = 0;
        let totalSim = 0;

        for (let i = 1; i < rows.length; i++) {
          const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          let fullName = columns[1] ? columns[1].replace(/"/g, '').trim() : '';
          
          const isHeader = fullName.toLowerCase() === 'nome completo' || 
                           fullName.toLowerCase() === 'nome' ||
                           fullName.toLowerCase().includes('completo');

          if (fullName.length >= 4 && !isHeader) {
            validCount++;
            if (rows[i].toLowerCase().includes('sim')) {
              totalSim++;
            }
          }
        }

        return res.json({ 
          totalSim, 
          totalRegistrations: validCount, 
          source: 'public_csv' 
        });
      }

      if (appsScriptUrl) {
        const response = await axios.get(appsScriptUrl + "?action=stats");
        return res.json(response.data);
      } 
      
      res.json({ totalSim: 0, totalRegistrations: 0, source: 'no_config' });
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
        
        await axios.post(appsScriptUrl, payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        res.json({ success: true, message: "Inscrição enviada com sucesso!" });
      } else {
        res.status(400).json({ success: false, error: "APPS_SCRIPT_URL nao configurada." });
      }
    } catch (error: any) {
      console.error("Erro no submit local:", error.message);
      res.status(500).json({ success: false, error: error.message });
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

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

// Google OAuth configuration status
app.get("/api/auth/google/status", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://localhost:${PORT}`;
  const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/callback`;

  res.json({
    configured: Boolean(clientId && clientSecret),
    clientId: clientId ? `${clientId.substring(0, 8)}...` : null,
    redirectUri,
  });
});

// Endpoint to generate Google OAuth Authorization URL
app.get("/api/auth/google/url", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
  const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://localhost:${PORT}`;
  const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/callback`;

  if (!clientId) {
    return res.status(400).json({
      configured: false,
      error: "GOOGLE_CLIENT_ID não configurado. Por favor, adicione GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas configurações de ambiente.",
      redirectUri,
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl, configured: true, redirectUri });
});

// OAuth Callback handler with cross-window postMessage
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    const errorMsg = error ? String(error) : "Código de autorização não recebido do Google.";
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/><title>Autenticação Google</title></head>
        <body style="background:#090d16;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:16px;box-sizing:border-box;">
          <div style="text-align:center;padding:28px;max-width:420px;width:100%;background:#0f172a;border-radius:20px;border:1px solid #ef4444;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <div style="width:48px;height:48px;background:rgba(239,68,68,0.15);color:#ef4444;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;margin-bottom:16px;">✕</div>
            <h2 style="color:#ef4444;margin:0 0 10px 0;font-size:18px;font-weight:800;">Erro na Autenticação</h2>
            <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0 0 16px 0;">${errorMsg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(errorMsg)} }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
    const appUrl = process.env.APP_URL || (req.headers.origin as string) || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl.replace(/\/$/, "")}/auth/callback`;

    // Exchange code for Google tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Falha ao validar credenciais Google: ${errText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; id_token?: string };

    // Fetch user profile info from Google API
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error("Não foi possível carregar os dados de perfil do Google.");
    }

    const userData = (await userResponse.json()) as { email: string; name?: string; picture?: string };

    const userPayload = JSON.stringify({
      email: userData.email,
      name: userData.name || userData.email.split("@")[0],
      picture: userData.picture || "",
    });

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/><title>Autenticado com Sucesso</title></head>
        <body style="background:#090d16;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:16px;box-sizing:border-box;">
          <div style="text-align:center;padding:32px;max-width:420px;width:100%;background:#0f172a;border-radius:24px;border:1px solid #3b82f6;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <div style="width:52px;height:52px;background:rgba(16,185,129,0.15);color:#10b981;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:26px;font-weight:bold;margin-bottom:16px;border:1px solid rgba(16,185,129,0.3);">✓</div>
            <h2 style="color:#ffffff;margin:0 0 8px 0;font-size:18px;font-weight:800;">Login Google Realizado!</h2>
            <p style="color:#f59e0b;font-weight:700;font-size:14px;margin:0 0 6px 0;">${userData.email}</p>
            <p style="color:#94a3b8;font-size:12px;margin:0;">Validando permissões de administrador...</p>
            <script>
              const payload = ${userPayload};
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: payload }, '*');
                setTimeout(() => window.close(), 1000);
              } else {
                window.location.href = '/';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Erro no callback OAuth do Google:", err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"/><title>Erro no Login</title></head>
        <body style="background:#090d16;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:16px;box-sizing:border-box;">
          <div style="text-align:center;padding:28px;max-width:420px;width:100%;background:#0f172a;border-radius:20px;border:1px solid #ef4444;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
            <h2 style="color:#ef4444;margin:0 0 10px 0;font-size:18px;">Erro na Autenticação Google</h2>
            <p style="color:#cbd5e1;font-size:13px;line-height:1.5;margin:0 0 16px 0;">${err.message || "Erro inesperado"}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: ${JSON.stringify(err.message || "Erro inesperado")} }, '*');
                setTimeout(() => window.close(), 3000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
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

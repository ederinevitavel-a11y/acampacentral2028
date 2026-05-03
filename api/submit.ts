import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;

    if (!appsScriptUrl || !appsScriptUrl.startsWith("https://script.google.com")) {
      return res.status(400).json({ success: false, error: "Servidor nao configurado com a URL da Macro (APPS_SCRIPT_URL)." });
    }

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

    return res.status(200).json({ success: true, message: "Inscrição enviada com sucesso!" });
  } catch (error: any) {
    console.error("Erro no submit:", error.message);
    return res.status(500).json({ 
      success: false, 
      error: "Erro ao enviar dados para a planilha.",
      details: error.message
    });
  }
}

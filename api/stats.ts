import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
      return res.status(200).json({ totalSim, totalRegistrations, source: 'public_csv' });
    }

    if (appsScriptUrl) {
      const response = await axios.get(appsScriptUrl + "?action=stats");
      return res.status(200).json(response.data);
    } 
    
    return res.status(200).json({ totalSim: 116, totalRegistrations: 142, source: 'fallback' });
  } catch (error) {
    console.error("Erro no stats:", error);
    return res.status(200).json({ totalSim: 0, totalRegistrations: 0, error: 'Erro ao ler dados' });
  }
}

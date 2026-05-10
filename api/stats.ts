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
      // Suporte para diferentes quebras de linha
      const rows = response.data.split(/\r?\n/).filter((r: string) => r.trim());
      
      let validCount = 0;
      let totalSim = 0;

      // i=0 é o título/cabeçalho, começamos do i=1
      for (let i = 1; i < rows.length; i++) {
        const columns = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // Coluna B é o índice 1 (Nome Completo)
        let fullName = columns[1] ? columns[1].replace(/"/g, '').trim() : '';
        
        // Verifica se é um cabeçalho comum
        const isHeader = fullName.toLowerCase() === 'nome completo' || 
                         fullName.toLowerCase() === 'nome' ||
                         fullName.toLowerCase().includes('completo');
        
        // Para ser considerado um inscrito válido:
        // 1. Deve ter pelo menos 4 caracteres (ex: "Eder")
        // 2. Não pode ser um dos termos de cabeçalho
        if (fullName.length >= 4 && !isHeader) {
          validCount++;
          // Se a linha contiver "Sim" (ou "sim"), conta como interessado
          if (rows[i].toLowerCase().includes('sim')) {
            totalSim++;
          }
        }
      }

      return res.status(200).json({ 
        totalSim, 
        totalRegistrations: validCount, 
        source: 'public_csv' 
      });
    }

    if (appsScriptUrl) {
      const response = await axios.get(appsScriptUrl + "?action=stats");
      return res.status(200).json(response.data);
    } 
    
    return res.status(200).json({ totalSim: 0, totalRegistrations: 0, source: 'no_data' });
  } catch (error) {
    console.error("Erro no stats:", error);
    return res.status(200).json({ totalSim: 0, totalRegistrations: 0, error: 'Erro ao ler dados' });
  }
}

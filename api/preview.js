import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Configurazione degli Head per la sicurezza e CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL mancante' });
  }

  try {
    // Chiamata HTTP simulando un browser desktop reale
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 6000 // 6 secondi di tolleranza prima del timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Recupero metadati con fallback in caso di assenza
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || url;
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || 'Nessuna descrizione disponibile';
    const image = $('meta[property="og:image"]').attr('content') || '';

    return res.status(200).json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim()
    });

  } catch (error) {
    console.error('Errore durante lo scraping di:', url, error.message);
    
    // Paracadute atomico: se il sito risponde male o va in timeout, restituiamo 
    // comunque un JSON pulito per non far crashare l'app.js
    return res.status(200).json({
      title: url.replace(/^https?:\/\/(www\.)?/, ''),
      description: 'Anteprima non disponibile per questo link',
      image: 'https://images.unsplash.com/photo-1594729187302-3c829e92ff0e?w=500&auto=format&fit=crop&q=60'
    });
  }
}
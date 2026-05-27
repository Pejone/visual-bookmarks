const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Gestione della sicurezza CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL mancante' });
  }

  try {
    // Usiamo un User-Agent reale per evitare che siti come GitHub diano l'errore 403/500 dicendo "A server error occurred"
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 5000 // Massimo 5 secondi di attesa per non bloccare la funzione
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Estraiamo i metadati OpenGraph o quelli standard come riserva
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Nessun titolo';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';

    // Rispondiamo SEMPRE con un JSON valido
    return res.status(200).json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim()
    });

  } catch (error) {
    console.error('Errore scraping:', error.message);
    
    // Anche se il sito fallisce (es. errore 404 o timeout), NON mandiamo in crash la funzione con un errore 500.
    // Restituiamo un JSON pulito vuoto in modo che app.js sappia gestirlo senza spaccarsi.
    return res.status(200).json({
      title: url.replace(/^https?:\/\/(www\.)?/, ''),
      description: 'Anteprima non disponibile',
      image: ''
    });
  }
};
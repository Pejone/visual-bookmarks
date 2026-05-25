import ogs from 'open-graph-scraper';

export default async function handler(req, res) {
  // Gestione della policy CORS per permettere al frontend di comunicare con l'API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gestione del preflight request (opzionale ma utile)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  // Controllo se l'URL è presente nella richiesta
  if (!url) {
    return res.status(400).json({ error: 'URL mancante nella richiesta.' });
  }

  try {
    const options = { 
      url: url,
      timeout: 5000, // Se un sito è troppo lento, interrompi dopo 5 secondi per evitare timeout di Vercel
      headers: {
        // Simuliamo un browser mobile per evitare che alcuni siti blocchino lo scraping
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
      }
    };
    
    // Esegui lo scraping dei tag Open Graph
    const { result } = await ogs(options);
    
    // Configura una cache di 1 giorno su Vercel per non ripetere lo scraping dello stesso link
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    // Estrai i dati o imposta dei fallback se mancano dei tag specifici
    return res.status(200).json({
      title: result.ogTitle || result.twitterTitle || "Sito senza titolo",
      image: result.ogImage?.[0]?.url || result.ogImage?.url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", 
      description: result.ogDescription || "Nessuna descrizione disponibile per questo segnalibro."
    });

  } catch (error) {
    // Se il sito è protetto da Cloudflare, è offline o dà errore, 
    // restituiamo comunque una risposta valida per non bloccare l'app sul telefono
    return res.status(200).json({
      title: url.replace(/^https?:\/\/(www\.)?/, ''), // Mostra l'URL pulito come titolo
      image: "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3", // Immagine di errore/fallback generica
      description: "Impossibile caricare l'anteprima (Sito protetto o non raggiungibile)."
    });
  }
}
const fileInput = document.getElementById('fileInput');
const bookmarksGrid = document.getElementById('bookmarksGrid');

// 1. All'avvio, controlla se ci sono già segnalibri salvati nel telefono
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('my_bookmarks');
  if (saved) {
    renderBookmarks(JSON.parse(saved));
  }
});

// 2. Gestisci il caricamento del file HTML esportato dal browser
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const text = event.target.result;
    
    // Usiamo DOMParser per leggere l'HTML dei segnalibri come se fosse un vero documento
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = doc.querySelectorAll('a');
    
    const bookmarksArray = Array.from(links).map(link => ({
      title: link.textContent || link.href,
      url: link.href
    }));

    // Salva nel localStorage del telefono e renderizza
    localStorage.setItem('my_bookmarks', JSON.stringify(bookmarksArray));
    renderBookmarks(bookmarksArray);
  };
  reader.readAsText(file);
});

// 3. Renderizza le scocche delle card e attiva il Lazy Loading
function renderBookmarks(bookmarks) {
  bookmarksGrid.innerHTML = '';
  
  // Configura l'Observer per pigliare l'anteprima solo quando la card è visibile
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const url = card.dataset.url;
        loadPreview(card, url);
        observer.unobserve(card); // Smetti di osservare questa card dopo aver avviato il caricamento
      }
    });
  }, { rootMargin: '100px' }); // Inizia a caricare 100px prima che appaia a schermo

  bookmarks.forEach(bm => {
    const card = document.createElement('a');
    card.href = bm.url;
    card.target = '_blank';
    card.dataset.url = bm.url;
    card.className = 'bookmark-card block bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition hover:scale-[1.02]';
    
    // Struttura iniziale della card (con uno scheletro di caricamento)
    card.innerHTML = `
      <div class="w-full h-40 bg-gray-700 animate-pulse flex items-center justify-center text-gray-500 text-sm placeholder-img">
        Caricamento...
      </div>
      <div class="p-4">
        <h2 class="font-semibold text-sm line-clamp-2 mb-1">${bm.title}</h2>
        <p class="text-xs text-gray-400 truncate">${bm.url}</p>
        <p class="text-xs text-gray-500 line-clamp-2 mt-2 desc-text"></p>
      </div>
    `;
    
    bookmarksGrid.appendChild(card);
    observer.observe(card);
  });
}

// 4. Chiamata in background alla tua Serverless Function di Vercel
async function loadPreview(card, url) {
  const placeholderImg = card.querySelector('.placeholder-img');
  const descText = card.querySelector('.desc-text');
  
  try {
    // Chiamata all'endpoint locale (Vercel lo mapperà automaticamente su /api/preview)
    const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    
    // Sostituisci lo scheletro di caricamento con l'immagine reale
    if (placeholderImg) {
      const img = document.createElement('img');
      img.src = data.image;
      img.alt = data.title;
      img.className = 'w-full h-40 object-cover';
      placeholderImg.replaceWith(img);
    }
    
    // Aggiorna la descrizione se disponibile
    if (data.description) {
      descText.textContent = data.description;
    }
  } catch (err) {
    if (placeholderImg) {
      placeholderImg.textContent = 'Anteprima non disponibile';
      placeholderImg.classList.remove('animate-pulse');
    }
  }
}
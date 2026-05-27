// ==========================================
// SELEZIONE ELEMENTI DEL DOM
// ==========================================

// Elementi dello Switch (Tab)
const tabHtml = document.getElementById('tabHtml');
const tabText = document.getElementById('tabText');
const sectionHtml = document.getElementById('sectionHtml');
const sectionText = document.getElementById('sectionText');

// Elementi di Input, Bottoni e Griglia
const fileInput = document.getElementById('fileInput');
const bulkLinksInput = document.getElementById('bulkLinksInput');
const addLinksBtn = document.getElementById('addLinksBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const bookmarksGrid = document.getElementById('bookmarksGrid');

// Array globale che tiene in memoria i segnalibri correnti
let currentBookmarks = [];

// ==========================================
// GESTIONE DELLO SWITCH GRAPHICO (TAB)
// ==========================================
if (tabHtml && tabText && sectionHtml && sectionText) {
  tabHtml.addEventListener('click', () => {
    tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md';
    tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200';
    sectionHtml.classList.remove('hidden');
    sectionText.classList.add('hidden');
  });

  tabText.addEventListener('click', () => {
    tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md';
    tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200';
    sectionText.classList.remove('hidden');
    sectionHtml.classList.add('hidden');
  });
}

// ==========================================
// CARICAMENTO INIZIALE E CONFIGURAZIONE DATA
// ==========================================

// Si attiva all'apertura dell'applicazione
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('my_bookmarks');
  if (saved) {
    currentBookmarks = JSON.parse(saved);
    renderBookmarks(currentBookmarks);
  }
});

// Metodo A: Gestione caricamento file HTML (esportato da Chrome/Takeout)
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const text = event.target.result;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const links = doc.querySelectorAll('a');
    
    const newBookmarks = Array.from(links).map(link => ({
      title: link.textContent || link.href,
      url: link.href
    }));

    mergeAndSaveBookmarks(newBookmarks);
    fileInput.value = ''; // Resetta l'input file per futuri caricamenti
  };
  reader.readAsText(file);
});

// Metodo B: Gestione inserimento a blocchi (Incolla Link o schede di Chrome)
addLinksBtn.addEventListener('click', () => {
  const text = bulkLinksInput.value.trim();
  if (!text) return;

  // Regex avanzata per catturare tutti gli URL validi nel testo
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const foundUrls = text.match(urlRegex);

  if (foundUrls && foundUrls.length > 0) {
    const newBookmarks = foundUrls.map(url => {
      // Pulisce l'URL da punteggiatura finale involontaria derivata dal testo
      const cleanUrl = url.replace(/[),.;]$/, '');
      return {
        title: cleanUrl.replace(/^https?:\/\/(www\.)?/, ''), // Titolo provvisorio basato sull'URL
        url: cleanUrl
      };
    });

    mergeAndSaveBookmarks(newBookmarks);
    bulkLinksInput.value = ''; // Svuota l'area di testo
  } else {
    alert("Nessun link valido trovato nel testo inserito!");
  }
});

// Unisce la vecchia lista alla nuova evitando duplicati e salvando in locale
function mergeAndSaveBookmarks(newLinks) {
  const uniqueNewLinks = newLinks.filter(newBm => 
    !currentBookmarks.some(oldBm => oldBm.url === newBm.url)
  );

  // Mette i nuovi inserimenti in cima alla griglia per vederli subito
  currentBookmarks = [...uniqueNewLinks, ...currentBookmarks];
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  renderBookmarks(currentBookmarks);
}

// ==========================================
// AZIONI GENERALI (ESPORTA E SVUOTA)
// ==========================================

// Pulsante per esportare la lista corrente/modificata in formato HTML standard
exportBtn.addEventListener('click', () => {
  if (currentBookmarks.length === 0) {
    alert("Non ci sono segnalibri da esportare!");
    return;
  }

  // Costruzione del file HTML secondo lo standard Netscape (riconosciuto da tutti i browser)
  let htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  currentBookmarks.forEach(bm => {
    htmlContent += `    <DT><A HREF="${bm.url}">${bm.title}</A>\n`;
  });

  htmlContent += `</DL><p>`;

  // Generazione del file virtuale e download forzato dal browser
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'segnalibri_aggiornati.html';
  document.body.appendChild(a);
  a.click();
  
  // Pulizia della memoria
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Pulsante per ripulire completamente lo schermo e svuotare il database locale
clearAllBtn.addEventListener('click', () => {
  const n = currentBookmarks.length;
  if (n === 0) {
    alert("Non ci sono segnalibri da cancellare!");
    return;
  }

  const confirmClear = confirm(`Sei sicuro di voler cancellare permanentemente tutti i tuoi ${n} segnalibri? L'azione non è annullabile.`);
  
  if (confirmClear) {
    currentBookmarks = [];
    localStorage.removeItem('my_bookmarks');
    renderBookmarks(currentBookmarks);
  }
});

// ==========================================
// GESTIONE CANCELLAZIONE SINGOLO LINK (X)
// ==========================================

// Definita sull'oggetto window per renderla accessibile dall'attributo "onclick" delle card generate
window.deleteBookmark = (index) => {
  currentBookmarks.splice(index, 1);
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  renderBookmarks(currentBookmarks);
};

// ==========================================
// RENDERING DELLE CARD E APIS (LAZY LOADING)
// ==========================================
function renderBookmarks(bookmarks) {
  bookmarksGrid.innerHTML = '';
  
  if (bookmarks.length === 0) {
    bookmarksGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Nessun segnalibro salvato. Scegli un metodo in alto per iniziare!</p>';
    return;
  }

  // IntersectionObserver per caricare le anteprime solo quando le card appaiono sullo schermo
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const url = card.dataset.url;
        loadPreview(card, url);
        observer.unobserve(card); // Smette di osservare la card una volta avviato il caricamento
      }
    });
  }, { rootMargin: '100px' });

  bookmarks.forEach((bm, index) => {
    const card = document.createElement('div');
    card.className = 'relative group bookmark-card block bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition hover:scale-[1.02]';
    card.dataset.url = bm.url;

    // Struttura della card: il tasto button (X) e il tag link (A) sono fratelli dentro il contenitore DIV
    card.innerHTML = `
      <button class="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 font-bold" 
              onclick="deleteBookmark(${index})">
        ✕
      </button>
      <a href="${bm.url}" target="_blank" class="block">
        <div class="w-full h-40 bg-gray-700 animate-pulse flex items-center justify-center text-gray-400 text-sm placeholder-img">
          Caricamento...
        </div>
        <div class="p-4">
          <h2 class="font-semibold text-sm line-clamp-2 mb-1 text-gray-100 bm-title">${bm.title}</h2>
          <p class="text-xs text-gray-400 truncate">${bm.url}</p>
          <p class="text-xs text-gray-500 line-clamp-2 mt-2 desc-text"></p>
        </div>
      </a>
    `;
    
    bookmarksGrid.appendChild(card);
    observer.observe(card);
  });
}

// Chiamata asincrona alla serverless function di Vercel per recuperare i metadati
async function loadPreview(card, url) {
  const placeholderImg = card.querySelector('.placeholder-img');
  const descText = card.querySelector('.desc-text');
  const titleText = card.querySelector('.bm-title');
  
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    
    if (placeholderImg) {
      const img = document.createElement('img');
      // Immagine di fallback astratta se il sito non ha OpenGraph immagini impostate
      img.src = data.image || 'https://images.unsplash.com/photo-1594729187302-3c829e92ff0e?w=500&auto=format&fit=crop&q=60';
      img.alt = data.title || 'Anteprima';
      img.className = 'w-full h-40 object-cover';
      placeholderImg.replaceWith(img);
    }
    
    if (data.title && titleText) {
      titleText.textContent = data.title;
    }
    
    if (data.description && descText) {
      descText.textContent = data.description;
    }
  } catch (err) {
    console.error("Errore nella generazione della preview:", err);
    if (placeholderImg) {
      placeholderImg.textContent = 'Anteprima non disponibile';
      placeholderImg.classList.remove('animate-pulse');
      placeholderImg.classList.add('bg-gray-700');
    }
  }
}

// ==========================================
// REGISTRAZIONE SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA Service Worker registrato correttamente!', reg))
      .catch(err => console.error('Errore registrazione Service Worker:', err));
  });
}
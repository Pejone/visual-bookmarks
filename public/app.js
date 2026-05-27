// ==========================================
// SELEZIONE ELEMENTI DEL DOM
// ==========================================
const tabHtml = document.getElementById('tabHtml');
const tabText = document.getElementById('tabText');
const sectionHtml = document.getElementById('sectionHtml');
const sectionText = document.getElementById('sectionText');

const fileInput = document.getElementById('fileInput');
const bulkLinksInput = document.getElementById('bulkLinksInput');
const addLinksBtn = document.getElementById('addLinksBtn');
const exportBtn = document.getElementById('exportBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const searchInput = document.getElementById('searchInput');
const bookmarksGrid = document.getElementById('bookmarksGrid');

// Array globale che tiene in memoria i segnalibri correnti
let currentBookmarks = [];

// ==========================================
// GESTIONE DELLO SWITCH GRAFICO (TAB)
// ==========================================
if (tabHtml && tabText && sectionHtml && sectionText) {
  tabHtml.addEventListener('click', () => {
    tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md cursor-pointer';
    tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200 cursor-pointer';
    sectionHtml.classList.remove('hidden');
    sectionText.classList.add('hidden');
  });

  tabText.addEventListener('click', () => {
    tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md cursor-pointer';
    tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200 cursor-pointer';
    sectionText.classList.remove('hidden');
    sectionHtml.classList.add('hidden');
  });
}

// ==========================================
// CARICAMENTO INIZIALE E CONFIGURAZIONE DATI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('my_bookmarks');
  if (saved) {
    currentBookmarks = JSON.parse(saved);
    renderBookmarks(currentBookmarks);
  }
});

// Metodo A: Gestione caricamento file HTML
if (fileInput) {
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
        id: 'bm_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
        title: link.textContent || link.href,
        url: link.href
      }));

      mergeAndSaveBookmarks(newBookmarks);
      fileInput.value = '';
    };
    reader.readAsText(file);
  });
}

// Metodo B: Gestione inserimento manuale (Incolla Link)
if (addLinksBtn) {
  addLinksBtn.addEventListener('click', () => {
    const text = bulkLinksInput.value.trim();
    if (!text) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundUrls = text.match(urlRegex);

    if (foundUrls && foundUrls.length > 0) {
      const newBookmarks = foundUrls.map(url => {
        const cleanUrl = url.replace(/[),.;]$/, '');
        return {
          id: 'bm_' + Date.now() + '_' + Math.floor(Math.random() * 100000),
          title: cleanUrl.replace(/^https?:\/\/(www\.)?/, ''),
          url: cleanUrl
        };
      });

      mergeAndSaveBookmarks(newBookmarks);
      bulkLinksInput.value = '';
    } else {
      alert("Nessun link valido trovato nel testo inserito!");
    }
  });
}

function mergeAndSaveBookmarks(newLinks) {
  const uniqueNewLinks = newLinks.filter(newBm => 
    !currentBookmarks.some(oldBm => oldBm.url === newBm.url)
  );

  currentBookmarks = [...uniqueNewLinks, ...currentBookmarks];
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  
  if (searchInput && searchInput.value) {
    searchInput.dispatchEvent(new Event('input'));
  } else {
    renderBookmarks(currentBookmarks);
  }
}

// ==========================================
// AZIONI GENERALI (ESPORTA E SVUOTA)
// ==========================================
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    if (currentBookmarks.length === 0) {
      alert("Non ci sono segnalibri da esportare!");
      return;
    }

    let htmlContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    currentBookmarks.forEach(bm => {
      htmlContent += `    <DT><A HREF="${bm.url}">${bm.title}</A>\n`;
    });

    htmlContent += `</DL><p>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'segnalibri_aggiornati.html';
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

if (clearAllBtn) {
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
      if (searchInput) searchInput.value = '';
      renderBookmarks(currentBookmarks);
    }
  });
}

// ==========================================
// RENDERING DELLE CARD E INTERSECTION OBSERVER
// ==========================================
function renderBookmarks(bookmarks) {
  if (!bookmarksGrid) return;
  bookmarksGrid.innerHTML = '';
  
  if (bookmarks.length === 0) {
    bookmarksGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Nessun segnalibro trovato.</p>';
    return;
  }

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const url = card.dataset.url;
        loadPreview(card, url);
        observer.unobserve(card);
      }
    });
  }, { 
    root: null, 
    rootMargin: '200px' 
  });

  bookmarks.forEach((bm) => {
    if (!bm.id) {
      bm.id = 'bm_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    }

    const card = document.createElement('div');
    card.className = 'relative bookmark-card block bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition hover:scale-[1.02]';
    card.dataset.url = bm.url;

    card.innerHTML = `
      <a href="${bm.url}" target="_blank" class="block w-full h-full">
        <div class="w-full h-40 bg-gray-700 animate-pulse flex items-center justify-center text-gray-400 text-sm placeholder-img">
          Caricamento...
        </div>
        <div class="p-4">
          <h2 class="font-semibold text-sm line-clamp-2 mb-1 text-gray-100 bm-title">${bm.title}</h2>
          <p class="text-xs text-gray-400 truncate">${bm.url}</p>
          <p class="text-xs text-gray-500 line-clamp-2 mt-2 desc-text"></p>
        </div>
      </a>
      <button class="btn-delete absolute top-2 right-2 z-50 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center font-bold text-base cursor-pointer" 
              data-id="${bm.id}"
              style="touch-action: manipulation;">
        ✕
      </button>
    `;
    
    bookmarksGrid.appendChild(card);
    observer.observe(card);
  });
}

// ==========================================
// INTERCETTAZIONE CLICK SUL TASTO CANCELLA (X)
// ==========================================
if (bookmarksGrid) {
  bookmarksGrid.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete');
    
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      
      const idDaCancellare = deleteBtn.dataset.id;
      currentBookmarks = currentBookmarks.filter(bm => bm.id !== idDaCancellare);
      
      localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
      
      if (searchInput && searchInput.value) {
        searchInput.dispatchEvent(new Event('input'));
      } else {
        renderBookmarks(currentBookmarks);
      }
    }
  });
}

// ==========================================
// FUNZIONE DI FILTRO / RICERCA IN REAL-TIME
// ==========================================
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      renderBookmarks(currentBookmarks);
      return;
    }
    
    const filtered = currentBookmarks.filter(bm => {
      const titleMatch = bm.title ? bm.title.toLowerCase().includes(query) : false;
      const urlMatch = bm.url ? bm.url.toLowerCase().includes(query) : false;
      return titleMatch || urlMatch;
    });
    
    renderBookmarks(filtered);
  });
}

// ==========================================
// CHIAMATA API SERVERLESS PER METADATI
// ==========================================
async function loadPreview(card, url) {
  const placeholderImg = card.querySelector('.placeholder-img');
  const descText = card.querySelector('.desc-text');
  const titleText = card.querySelector('.bm-title');
  const defaultImage = 'https://images.unsplash.com/photo-1594729187302-3c829e92ff0e?w=500&auto=format&fit=crop&q=60';
  
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    
    if (placeholderImg) {
      const img = document.createElement('img');
      
      // Controllo iniziale sulla stringa vuota
      img.src = (data.image && data.image.trim() !== '') ? data.image : defaultImage;
      img.alt = data.title || 'Anteprima';
      img.className = 'w-full h-40 object-cover';
      
      // SCUDO ANTICRASH LATO CLIENT
      // Se il link sembrava valido ma il browser dà errore 404/hotlink a caricamento iniziato,
      // intercettiamo l'evento e forziamo l'immagine Unsplash.
      img.onerror = function() {
        this.onerror = null; // Evita loop infiniti
        this.src = defaultImage;
      };

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
      const img = document.createElement('img');
      img.src = defaultImage;
      img.alt = 'Anteprima non disponibile';
      img.className = 'w-full h-40 object-cover';
      placeholderImg.replaceWith(img);
    }
  }
}

// ==========================================
// REGISTRAZIONE SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA Service Worker registrato!', reg))
      .catch(err => console.error('Errore SW:', err));
  });
}
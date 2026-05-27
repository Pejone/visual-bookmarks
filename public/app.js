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
const bookmarksGrid = document.getElementById('bookmarksGrid');

// Array globale che tiene in memoria i segnalibri correnti
let currentBookmarks = [];

// ==========================================
// GESTIONE DELLO SWITCH GRAFICO (TAB)
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
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('my_bookmarks');
  if (saved) {
    currentBookmarks = JSON.parse(saved);
    renderBookmarks(currentBookmarks);
  }
});

// Metodo A: Gestione caricamento file HTML
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

// Metodo B: Gestione inserimento manuale (Incolla Link)
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

function mergeAndSaveBookmarks(newLinks) {
  const uniqueNewLinks = newLinks.filter(newBm => 
    !currentBookmarks.some(oldBm => oldBm.url === newBm.url)
  );

  currentBookmarks = [...uniqueNewLinks, ...currentBookmarks];
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  renderBookmarks(currentBookmarks);
}

// ==========================================
// AZIONI GENERALI (ESPORTA E SVUOTA)
// ==========================================
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
// RENDERING DELLE CARD E CONTROLLO CLICK (X)
// ==========================================
function renderBookmarks(bookmarks) {
  bookmarksGrid.innerHTML = '';
  
  if (bookmarks.length === 0) {
    bookmarksGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Nessun segnalibro salvato. Scegli un metodo in alto per iniziare!</p>';
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
  }, { rootMargin: '100px' });

  bookmarks.forEach((bm) => {
    if (!bm.id) {
      bm.id = 'bm_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    }

    const card = document.createElement('div');
    card.className = 'relative bookmark-card block bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition hover:scale-[1.02]';
    card.dataset.url = bm.url;

    // MODIFICA CRUCIALI NELLE CLASSI DEL BOTTONE:
    // Rimossi 'opacity-100', 'md:opacity-0', ecc. Adesso è un blocco nativo z-50 sempre reattivo.
    card.innerHTML = `
      <button class="btn-delete absolute top-2 right-2 z-50 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center font-bold text-base cursor-pointer" 
              data-id="${bm.id}" 
              style="touch-action: manipulation;">
        ✕
      </button>
      <a href="${bm.url}" target="_blank" class="block relative z-10">
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

  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
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
      .then(reg => console.log('PWA Service Worker registrato!', reg))
      .catch(err => console.error('Errore SW:', err));
  });
}
// Elementi dello Switch
const tabHtml = document.getElementById('tabHtml');
const tabText = document.getElementById('tabText');
const sectionHtml = document.getElementById('sectionHtml');
const sectionText = document.getElementById('sectionText');

// Elementi di Input e Griglia
const fileInput = document.getElementById('fileInput');
const bulkLinksInput = document.getElementById('bulkLinksInput');
const addLinksBtn = document.getElementById('addLinksBtn');
const bookmarksGrid = document.getElementById('bookmarksGrid');
const clearAllBtn = document.getElementById('clearAllBtn');

// Array globale per i segnalibri
let currentBookmarks = [];


// Registrazione del Service Worker per la PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrato con successo!', reg))
      .catch(err => console.error('Errore nella registrazione del Service Worker:', err));
  });
}
// ==========================================
// LOGICA DELLO SWITCH (TAB CONTROLLER)
// ==========================================
tabHtml.addEventListener('click', () => {
  // Attiva pulsante HTML
  tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md';
  tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200';
  // Mostra sezione HTML, nascondi Testo
  sectionHtml.classList.remove('hidden');
  sectionText.classList.add('hidden');
});

tabText.addEventListener('click', () => {
  // Attiva pulsante Incolla Link
  tabText.className = 'flex-1 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white transition-all duration-200 shadow-md';
  tabHtml.className = 'flex-1 py-2 text-sm font-medium rounded-lg text-gray-400 hover:text-gray-200 transition-all duration-200';
  // Mostra sezione Testo, nascondi HTML
  sectionText.classList.remove('hidden');
  sectionHtml.classList.add('hidden');
});

// ==========================================
// LOGICA PER SVUOTARE I SEGNALIBRI
// ==========================================
clearAllBtn.addEventListener('click', () => {
  const n = currentBookmarks.length;
  if (n === 0) {
    alert("Non ci sono segnalibri da cancellare!");
    return;
  }

  const confirmClear = confirm(`Sei sicuro di voler cancellare permanentemente tutti i tuoi ${n} segnalibri? L'azione non è annullabile.`);

  if (confirmClear) {
    currentBookmarks = []; // Svuota l'array in memoria
    localStorage.removeItem('my_bookmarks'); // Cancella i dati dal telefono
    renderBookmarks(currentBookmarks); // Aggiorna l'interfaccia (mostrerà il messaggio "Nessun segnalibro")
    fileInput.value = ''; // Resetta anche l'eventuale file selezionato nell'input
  }
});

// ==========================================
// CARICAMENTO INIZIALE E GESTIONE DATI
// ==========================================

// Carica i dati salvati all'avvio
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('my_bookmarks');
  if (saved) {
    currentBookmarks = JSON.parse(saved);
    renderBookmarks(currentBookmarks);
  }
});

// Gestione dell'importazione del file HTML
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
  };
  reader.readAsText(file);
});

// Gestione dell'inserimento manuale a blocchi (Copia e Incolla)
addLinksBtn.addEventListener('click', () => {
  const text = bulkLinksInput.value.trim();
  if (!text) return;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const foundUrls = text.match(urlRegex);

  if (foundUrls && foundUrls.length > 0) {
    const newBookmarks = foundUrls.map(url => {
      const cleanUrl = url.replace(/[),.;]$/, '');
      return {
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

// Unisce le liste, rimuove i duplicati e salva
function mergeAndSaveBookmarks(newLinks) {
  const uniqueNewLinks = newLinks.filter(newBm => 
    !currentBookmarks.some(oldBm => oldBm.url === newBm.url)
  );

  currentBookmarks = [...uniqueNewLinks, ...currentBookmarks];
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  renderBookmarks(currentBookmarks);
}


// ==========================================
// RENDERING DELLE CARD E APIS (LAZY LOADING)
// ==========================================
function renderBookmarks(bookmarks) {
  bookmarksGrid.innerHTML = '';
  
  if (bookmarks.length === 0) {
    bookmarksGrid.innerHTML = '<p class="text-center text-gray-500 col-span-full py-8">Nessun segnalibro salvato.</p>';
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

  bookmarks.forEach((bm, index) => {
    const card = document.createElement('div'); // Cambiato in div per contenere il tasto
    card.className = 'relative group bookmark-card block bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition hover:scale-[1.02]';
    card.dataset.url = bm.url;

    // Aggiungiamo il tasto "X" in alto a destra (si vede solo se tocchi o passi sopra)
    card.innerHTML = `
      <button class="absolute top-2 right-2 z-10 bg-red-600/80 hover:bg-red-500 text-white w-8 h-8 rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 md:opacity-50" 
              onclick="deleteBookmark(${index})">
        ✕
      </button>
      <a href="${bm.url}" target="_blank" class="block">
        <div class="w-full h-40 bg-gray-700 animate-pulse flex items-center justify-center text-gray-500 text-sm placeholder-img">
          Caricamento...
        </div>
        <div class="p-4">
          <h2 class="font-semibold text-sm line-clamp-2 mb-1 bm-title">${bm.title}</h2>
          <p class="text-xs text-gray-400 truncate">${bm.url}</p>
          <p class="text-xs text-gray-500 line-clamp-2 mt-2 desc-text"></p>
        </div>
      </a>
    `;
    
    bookmarksGrid.appendChild(card);
    observer.observe(card);
  });
}

// Funzione globale per eliminare un singolo segnalibro
window.deleteBookmark = (index) => {
  // Rimuove il segnalibro dall'array
  currentBookmarks.splice(index, 1);
  // Salva il nuovo stato
  localStorage.setItem('my_bookmarks', JSON.stringify(currentBookmarks));
  // Ridisegna la griglia
  renderBookmarks(currentBookmarks);
};
// js/galeri.js - Untuk galeri.html

let allMedia = [];
let filteredMedia = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Loading gallery page...');
  
  // ============================================
  // LOAD DATA FUNCTIONS
  // ============================================
  
  async function loadFromFirebase() {
    try {
      console.log('Mencoba load dari Firebase...');
      
      // Query dengan sorting berdasarkan tanggal (terbaru dulu)
      const q = window.firestore.query(
        window.firestore.collection(window.db, 'galeri'),
        window.firestore.orderBy('tanggal', 'desc'),
        window.firestore.orderBy('timestamp', 'desc')
      );
      
      const snapshot = await window.firestore.getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      return null;
    }
  }
  
  function loadFromDataJS() {
    console.log('Mencoba load dari Data.js...');
    
    if (typeof DATA !== 'undefined' && DATA.galeri) {
      // Sort berdasarkan tanggal (terbaru dulu)
      return DATA.galeri.sort((a, b) => {
        const dateA = new Date(a.tanggal || a.timestamp || 0);
        const dateB = new Date(b.tanggal || b.timestamp || 0);
        return dateB - dateA;
      });
    }
    return null;
  }
  
  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  function renderGallery() {
    const gallery = document.getElementById('galleryGrid');
    if (!gallery) return;
    
    if (filteredMedia.length === 0) {
      gallery.innerHTML = `
        <div style="text-align:center;padding:40px;color:#64748b;grid-column:1/-1;">
          <div style="font-size:48px;margin-bottom:10px;">📸</div>
          <p>Tidak ada media di kategori ini</p>
        </div>
      `;
      return;
    }
    
    gallery.innerHTML = filteredMedia.map(item => {
      const tanggal = item.tanggal ? 
        formatTanggal(item.tanggal) : 
        (item.timestamp ? formatTanggal(item.timestamp.toDate?.()) : '');
      
      const mediaElement = item.type === 'video'
        ? `<div class="video-container">
             <video src="${item.url}" muted loop></video>
             <div class="video-badge">🎥 Video</div>
           </div>`
        : `<img src="${item.url}" alt="${item.title}" loading="lazy">`;
      
      return `
        <div class="gallery-item" onclick="openMedia('${item.id}')">
          ${mediaElement}
          <div class="gallery-caption">
            <div class="gallery-title">${item.title}</div>
            ${item.caption ? `<div class="gallery-description">${item.caption}</div>` : ''}
            <div class="gallery-meta">
              ${tanggal ? `<span class="gallery-date">📅 ${tanggal}</span>` : ''}
              <span class="gallery-category">${getCategoryIcon(item.category)} ${item.category}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    updateCounter();
  }
  
  function filterGallery(category) {
    currentFilter = category;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const clickedTab = event.target;
    clickedTab.classList.add('active');
    
    if (category === 'all') {
      filteredMedia = [...allMedia];
    } else {
      filteredMedia = allMedia.filter(m => m.category === category);
    }
    
    renderGallery();
  }
  
  function updateCounter() {
    const counter = document.getElementById('mediaCount');
    if (counter) {
      counter.textContent = filteredMedia.length;
    }
  }
  
  function openMedia(mediaId) {
    const media = allMedia.find(m => m.id === mediaId);
    if (!media) return;
    
    // Create simple modal
    const modalHTML = `
      <div id="mediaModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="position:relative;max-width:90%;max-height:90%;">
          <button onclick="closeMediaModal()" style="position:absolute;top:-40px;right:0;background:#ef4444;color:white;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;">✕</button>
          ${media.type === 'video' ? 
            `<video src="${media.url}" controls autoplay style="max-width:100%;max-height:80vh;border-radius:10px;"></video>` : 
            `<img src="${media.url}" alt="${media.title}" style="max-width:100%;max-height:80vh;border-radius:10px;">`}
          <div style="background:#1e293b;padding:15px;border-radius:0 0 10px 10px;margin-top:-5px;">
            <h3 style="color:white;margin:0 0 5px 0;">${media.title}</h3>
            ${media.caption ? `<p style="color:#94a3b8;margin:0 0 5px 0;">${media.caption}</p>` : ''}
            ${media.tanggal ? `<p style="color:#64748b;font-size:12px;margin:0;">📅 ${formatTanggal(media.tanggal)}</p>` : ''}
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('mediaModal');
    if (existingModal) existingModal.remove();
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }
  
  function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    if (modal) modal.remove();
    document.body.style.overflow = 'auto';
  }
  
  // Helper functions
  function formatTanggal(dateInput) {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }
  
  function getCategoryIcon(category) {
    const icons = {
      'foto-terbaru': '📸',
      'kenangan': '💝',
      'prestasi': '🏆',
      'piknik': '🏕️',
      'ulang-tahun': '🎂'
    };
    return icons[category] || '📁';
  }
  
  // ============================================
  // MAIN LOADING LOGIC
  // ============================================
  
  try {
    let media = null;
    
    // Coba load dari Firebase dulu
    if (window.firestore) {
      media = await loadFromFirebase();
    }
    
    // Jika Firebase gagal, coba dari Data.js
    if (!media) {
      media = loadFromDataJS();
    }
    
    // Jika masih tidak ada data, tampilkan error
    if (!media) {
      console.error('Tidak bisa load data dari mana pun');
      document.getElementById('galleryGrid').innerHTML = `
        <div style="text-align:center;padding:40px;color:#f87171;grid-column:1/-1;">
          <div style="font-size:48px;margin-bottom:10px;">⚠️</div>
          <p>Error memuat galeri</p>
          <p style="font-size:12px;color:#94a3b8;">Coba refresh halaman</p>
        </div>
      `;
      return;
    }
    
    allMedia = media;
    filteredMedia = [...allMedia];
    renderGallery();
    
    console.log('✅ Gallery page loaded successfully');
    
  } catch (error) {
    console.error('Error loading gallery:', error);
    document.getElementById('galleryGrid').innerHTML = `
      <div style="text-align:center;padding:40px;color:#f87171;grid-column:1/-1;">
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
  
  // ============================================
  // EXPORT FUNCTIONS GLOBALLY
  // ============================================
  window.filterGallery = filterGallery;
  window.openMedia = openMedia;
  window.closeMediaModal = closeMediaModal;
});
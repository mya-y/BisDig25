// js/main.js - ALL IN ONE SOLUTION
console.log('🚀 Loading main.js...');

// ============================================
// 1. INITIAL SETUP
// ============================================

// Hide loading screen
window.addEventListener('load', function() {
  setTimeout(() => {
    const loading = document.getElementById('globalLoading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => {
        loading.style.display = 'none';
      }, 300);
    }
  }, 500);
});

// Navigation functions
window.toggleMenu = function() {
  const menu = document.getElementById('navMenu');
  if (menu) menu.classList.toggle('show');
};

window.scrollToSection = function(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.remove('show');
  }
};

// ============================================
// 2. RENDER ALL CONTENT FROM Data.js
// ============================================

function renderAllContent() {
  console.log('🎨 Rendering all content...');
  
  // A. RENDER STRUKTUR KELAS
  renderStruktur();
  
  // B. RENDER FOTO TERBARU
  renderFotoTerbaru();
  
  // C. RENDER KENANGAN
  renderKenangan();
}

// A. STRUKTUR KELAS
function renderStruktur() {
  const container = document.getElementById('strukturGrid');
  if (!container) {
    console.error('❌ Struktur container not found');
    return;
  }
  
  if (!DATA || !DATA.struktur || DATA.struktur.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Data struktur sedang diatur</p>';
    return;
  }
  
  console.log(`📊 Rendering ${DATA.struktur.length} struktur items`);
  
  let html = '';
  const showCount = 23; // Tampilkan 8 pertama
  
  // Render anggota
  DATA.struktur.slice(0, showCount).forEach((anggota, index) => {
    const initial = anggota.initial || (anggota.nama ? anggota.nama.charAt(0).toUpperCase() : '?');
    
    html += `
      <div class="anggota-card">
        <div class="anggota-foto">
          ${anggota.foto && anggota.foto !== 'null' ? 
            `<img src="${anggota.foto}" alt="${anggota.nama}" loading="lazy">` : 
            `<div class="initial-placeholder">${initial}</div>`
          }
        </div>
        <div class="anggota-info">
          <h4>${anggota.nama || 'Anggota'}</h4>
          <p>${anggota.jabatan || 'Kelas'}</p>
        </div>
      </div>
    `;
  });
  
  // Tambah "lihat semua" jika lebih dari 8
  if (DATA.struktur.length > showCount) {
    html += `
      <div class="anggota-card see-more">
        <div class="initial-placeholder">+${DATA.struktur.length - showCount}</div>
        <div class="anggota-info">
          <h4>Anggota Lainnya</h4>
          <p>Total ${DATA.struktur.length} anggota</p>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = html;
  console.log('✅ Struktur rendered');
}

// B. FOTO TERBARU
function renderFotoTerbaru() {
  const container = document.getElementById('fotoTerbaruGrid');
  if (!container) {
    console.error('❌ Foto container not found');
    return;
  }
  
  if (!DATA || !DATA.galeri) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Foto akan segera diupload</p>';
    return;
  }
  
  // Filter hanya foto terbaru
  const fotoTerbaru = DATA.galeri.filter(item => 
    item.category === 'foto-terbaru' || item.type === 'foto'
  ).slice(0, 4); // Max 4 foto
  
  if (fotoTerbaru.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Belum ada foto terbaru</p>';
    return;
  }
  
  console.log(`📸 Rendering ${fotoTerbaru.length} foto terbaru`);
  
  let html = '';
  fotoTerbaru.forEach(foto => {
    html += `
      <div class="photo-card">
        <div class="photo-img">
          <img src="${foto.url}" alt="${foto.title || 'Foto'}" loading="lazy">
        </div>
        <div class="photo-info">
          <p>${foto.title || 'Foto Kelas'}</p>
          ${foto.caption ? `<small>${foto.caption}</small>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  console.log('✅ Foto terbaru rendered');
}

// C. KENANGAN
function renderKenangan() {
  const container = document.getElementById('kenanganPreview');
  if (!container) {
    console.error('❌ Kenangan container not found');
    return;
  }
  
  if (!DATA || !DATA.galeri) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Belum ada kenangan</p>';
    return;
  }
  
  // Filter hanya kenangan
  const kenangan = DATA.galeri.filter(item => 
    item.category === 'kenangan' || item.type === 'video'
  ).slice(0, 4); // Max 3 kenangan
  
  if (kenangan.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Belum ada kenangan</p>';
    return;
  }
  
  console.log(`🎥 Rendering ${kenangan.length} kenangan`);
  
  let html = '';
  kenangan.forEach(item => {
    if (item.type === 'video') {
      html += `
        <div class="kenangan-item video">
          <div class="kenangan-media">
            <video src="${item.url}" controls muted></video>
            <div class="video-badge">🎥</div>
          </div>
          <div class="kenangan-info">
            <h4>${item.title || 'Video Kenangan'}</h4>
            ${item.caption ? `<p>${item.caption}</p>` : ''}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="kenangan-item">
          <div class="kenangan-media">
            <img src="${item.url}" alt="${item.title || 'Kenangan'}" loading="lazy">
          </div>
          <div class="kenangan-info">
            <h4>${item.title || 'Foto Kenangan'}</h4>
            ${item.caption ? `<p>${item.caption}</p>` : ''}
          </div>
        </div>
      `;
    }
  });
  
  container.innerHTML = html;
  console.log('✅ Kenangan rendered');
}

// ============================================
// 3. INITIALIZE EVERYTHING
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM ready');
  
  // Tunggu sebentar untuk pastikan Data.js sudah dimuat
  setTimeout(() => {
    if (typeof DATA !== 'undefined') {
      console.log('✅ Data.js loaded:', DATA);
      renderAllContent();
    } else {
      console.error('❌ Data.js not found!');
      
      // Fallback: render dengan data kosong
      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
      });
    }
  }, 100);
});

// Force show all sections
setTimeout(() => {
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '1';
    section.style.visibility = 'visible';
  });
}, 1000);
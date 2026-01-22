// js/main.js - PRODUCTION READY VERSION
console.log('🚀 Loading main.js v2.0...');

// ============================================
// 1. GLOBAL ERROR HANDLER
// ============================================
window.addEventListener('error', function(e) {
  console.error('❌ Global Error:', e.message, e.filename, e.lineno);
});

// ============================================
// 2. DATA CHECKER - CRITICAL!
// ============================================
function checkDataAvailability() {
  console.log('🔍 Checking DATA availability...');
  
  if (typeof DATA === 'undefined') {
    console.error('❌ CRITICAL: DATA is undefined!');
    console.log('📋 Available global variables:', Object.keys(window));
    return false;
  }
  
  console.log('✅ DATA found:', {
    galeri: DATA.galeri?.length || 0,
    struktur: DATA.struktur?.length || 0,
    jadwal: DATA.jadwal?.length || 0,
    prestasi: DATA.prestasi?.length || 0
  });
  
  return true;
}

// ============================================
// 3. SAFE RENDER FUNCTIONS
// ============================================

// A. STRUKTUR KELAS - dengan fallback
function renderStruktur() {
  console.log('👥 Rendering Struktur...');
  const container = document.getElementById('strukturGrid');
  
  if (!container) {
    console.error('❌ strukturGrid container not found');
    return;
  }
  
  // Fallback jika DATA tidak ada
  if (!DATA || !DATA.struktur || DATA.struktur.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">
        <p>📊 Data struktur sedang dimuat...</p>
        <small>Jika masalah berlanjut, hubungi admin</small>
      </div>
    `;
    return;
  }
  
  const showCount = 23;
  let html = '';
  
  DATA.struktur.slice(0, showCount).forEach((anggota) => {
    const initial = anggota.initial || (anggota.nama ? anggota.nama.charAt(0).toUpperCase() : '?');
    const fotoUrl = anggota.foto && anggota.foto !== 'null' && anggota.foto !== null ? anggota.foto : null;
    
    html += `
      <div class="anggota-card">
        <div class="anggota-foto">
          ${fotoUrl ? 
            `<img src="${fotoUrl}" alt="${anggota.nama}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="initial-placeholder" style="display:none;">${initial}</div>` : 
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
  console.log(`✅ Struktur rendered: ${DATA.struktur.length} items`);
}

// B. FOTO TERBARU - dengan error handling
function renderFotoTerbaru() {
  console.log('📸 Rendering Foto Terbaru...');
  const container = document.getElementById('fotoTerbaruGrid');
  
  if (!container) {
    console.error('❌ fotoTerbaruGrid container not found');
    return;
  }
  
  if (!DATA || !DATA.galeri) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">
        <p>📸 Foto akan segera diupload</p>
      </div>
    `;
    return;
  }
  
  const fotoTerbaru = DATA.galeri
    .filter(item => item.category === 'foto-terbaru' || item.type === 'image')
    .filter(item => item.url) // Pastikan ada URL
    .slice(0, 4);
  
  if (fotoTerbaru.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b;">
        <p>Belum ada foto terbaru</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  fotoTerbaru.forEach(foto => {
    html += `
      <div class="photo-card">
        <div class="photo-img">
          <img src="${foto.url}" 
               alt="${foto.title || 'Foto'}" 
               loading="lazy"
               onerror="this.parentElement.parentElement.style.display='none';">
        </div>
        <div class="photo-info">
          <p>${foto.title || 'Foto Kelas'}</p>
          ${foto.caption ? `<small>${foto.caption}</small>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  console.log(`✅ Foto terbaru rendered: ${fotoTerbaru.length} items`);
}

// C. KENANGAN - support video & foto
function renderKenangan() {
  console.log('💝 Rendering Kenangan...');
  const container = document.getElementById('kenanganPreview');
  
  if (!container) {
    console.error('❌ kenanganPreview container not found');
    return;
  }
  
  if (!DATA || !DATA.galeri) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#64748b;">
        <p>Belum ada kenangan</p>
      </div>
    `;
    return;
  }
  
  const kenangan = DATA.galeri
    .filter(item => item.category === 'kenangan')
    .filter(item => item.url)
    .slice(0, 4);
  
  if (kenangan.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#64748b;">
        <p>Belum ada kenangan</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  kenangan.forEach(item => {
    if (item.type === 'video') {
      html += `
        <div class="kenangan-item video">
          <div class="kenangan-media">
            <video src="${item.url}" controls muted preload="metadata"></video>
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
            <img src="${item.url}" 
                 alt="${item.title || 'Kenangan'}" 
                 loading="lazy"
                 onerror="this.parentElement.parentElement.style.display='none';">
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
  console.log(`✅ Kenangan rendered: ${kenangan.length} items`);
}

// ============================================
// 4. MAIN RENDER FUNCTION
// ============================================
function renderAllContent() {
  console.log('🎨 Starting renderAllContent...');
  
  try {
    renderStruktur();
  } catch (e) {
    console.error('❌ Error rendering struktur:', e);
  }
  
  try {
    renderFotoTerbaru();
  } catch (e) {
    console.error('❌ Error rendering foto terbaru:', e);
  }
  
  try {
    renderKenangan();
  } catch (e) {
    console.error('❌ Error rendering kenangan:', e);
  }
  
  // Show all sections
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '1';
    section.style.visibility = 'visible';
  });
  
  console.log('✅ All content rendered');
}

// ============================================
// 5. NAVIGATION FUNCTIONS
// ============================================
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
// 6. INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM Content Loaded');
  
  // Hide loading screen
  setTimeout(() => {
    const loading = document.getElementById('globalLoading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.style.display = 'none', 300);
    }
  }, 500);
  
  // Wait untuk Data.js
  let attempts = 0;
  const maxAttempts = 10;
  
  const checkAndRender = setInterval(() => {
    attempts++;
    console.log(`🔄 Attempt ${attempts}/${maxAttempts} to load DATA...`);
    
    if (checkDataAvailability()) {
      clearInterval(checkAndRender);
      renderAllContent();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkAndRender);
      console.error('❌ Failed to load DATA after', maxAttempts, 'attempts');
      
      // Show error message to user
      document.body.insertAdjacentHTML('beforeend', `
        <div style="position:fixed; bottom:20px; right:20px; background:#ef4444; color:white; padding:15px 20px; border-radius:8px; z-index:9999;">
          ⚠️ Gagal memuat data. Silakan refresh halaman.
        </div>
      `);
    }
  }, 200);
});

// Force show sections after 2 seconds (fallback)
setTimeout(() => {
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '1';
    section.style.visibility = 'visible';
  });
}, 2000);

console.log('✅ main.js loaded successfully');// 2. RENDER ALL CONTENT FROM Data.js
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

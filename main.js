// main.js - FIREBASE COMPATIBLE VERSION
console.log('🚀 Loading main.js...');

// ============================================
// 1. WAIT FOR FIREBASE & DATA
// ============================================
let DATA = null;
let isFirebaseReady = false;

// Fungsi untuk load data dari Firebase
async function loadDataFromFirebase() {
  console.log('📡 Loading data from Firebase...');
  
  try {
    // Gunakan window.db dan window.firestore yang sudah di-export
    const { getDocs, collection } = window.firestore;
    const db = window.db;
    
    const galeriSnapshot = await getDocs(collection(db, 'galeri'));
    const strukturSnapshot = await getDocs(collection(db, 'struktur'));
    const jadwalSnapshot = await getDocs(collection(db, 'jadwal'));
    const tugasSnapshot = await getDocs(collection(db, 'tugas'));
    const prestasiSnapshot = await getDocs(collection(db, 'prestasi'));
    
    DATA = {
      galeri: galeriSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      struktur: strukturSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      jadwal: jadwalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      tugas: tugasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      prestasi: prestasiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    };
    
    // Split jadwal by mode
    DATA.jadwalData = DATA.jadwal.filter(j => j.mode === 'regular');
    DATA.jadwalUTS = DATA.jadwal.filter(j => j.mode === 'uts');
    DATA.jadwalUAS = DATA.jadwal.filter(j => j.mode === 'uas');
    
    console.log('✅ Firebase data loaded successfully:', DATA);
    return true;
    
  } catch (error) {
    console.error('❌ Firebase load failed:', error);
    return false;
  }
}

// Fungsi untuk cek apakah ada Data.js (fallback)
function checkDataJS() {
  if (typeof window.DATA !== 'undefined' && window.DATA) {
    console.log('✅ Data.js found as fallback');
    DATA = window.DATA;
    return true;
  }
  return false;
}

// ============================================
// 2. NAVIGATION
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
// 3. RENDER STRUKTUR (SEMUA 23 ANGGOTA)
// ============================================
function renderStruktur() {
  const container = document.getElementById('strukturGrid');
  if (!container) return;
  
  if (!DATA || !DATA.struktur || DATA.struktur.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Data struktur belum tersedia</p>';
    return;
  }
  
  console.log(`📊 Rendering ${DATA.struktur.length} struktur items`);
  
  let html = '';
  
  // TAMPILKAN SEMUA ANGGOTA (23 orang)
  DATA.struktur
    .sort((a, b) => (a.urutan || 999) - (b.urutan || 999))
    .forEach(anggota => {
      const initial = anggota.initial || (anggota.nama ? anggota.nama.charAt(0).toUpperCase() : '?');
      
      html += `
        <div class="anggota-card">
          <div class="anggota-foto">
            ${anggota.foto && anggota.foto !== 'null' && anggota.foto !== null ? 
              `<img src="${anggota.foto}" alt="${anggota.nama}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
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
  
  container.innerHTML = html;
  console.log(`✅ Struktur rendered - ${DATA.struktur.length} anggota ditampilkan`);
}

// ============================================
// 4. RENDER FOTO TERBARU
// ============================================
function renderFotoTerbaru() {
  const container = document.getElementById('fotoTerbaruGrid');
  if (!container) return;
  
  if (!DATA || !DATA.galeri || DATA.galeri.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Foto akan segera diupload</p>';
    return;
  }
  
  // Filter foto terbaru
  const fotoTerbaru = DATA.galeri
    .filter(item => item.category === 'foto-terbaru' && item.type === 'image')
    .sort((a, b) => {
      const dateA = new Date(a.tanggal || 0);
      const dateB = new Date(b.tanggal || 0);
      return dateB - dateA;
    })
    .slice(0, 4);
  
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
          <img src="${foto.url}" alt="${foto.title || 'Foto'}" loading="lazy" 
               onerror="this.parentElement.innerHTML='<div style=padding:20px;text-align:center;color:#64748b>❌ Gambar error</div>'">
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

// ============================================
// 5. RENDER KENANGAN
// ============================================
function renderKenangan() {
  const container = document.getElementById('kenanganPreview');
  if (!container) return;
  
  if (!DATA || !DATA.galeri || DATA.galeri.length === 0) {
    container.innerHTML = '<p style="text-align:center;padding:20px;color:#64748b">Belum ada kenangan</p>';
    return;
  }
  
  // Filter kenangan
  const kenangan = DATA.galeri
    .filter(item => item.category === 'kenangan')
    .sort((a, b) => {
      const dateA = new Date(a.tanggal || 0);
      const dateB = new Date(b.tanggal || 0);
      return dateB - dateA;
    })
    .slice(0, 3);
  
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
            <img src="${item.url}" alt="${item.title || 'Kenangan'}" loading="lazy"
                 onerror="this.parentElement.innerHTML='<div style=padding:20px;text-align:center;color:#64748b>❌ Gambar error</div>'">
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
// 6. RENDER ALL
// ============================================
function renderAllContent() {
  console.log('🎨 Rendering all content...');
  try {
    renderStruktur();
    renderFotoTerbaru();
    renderKenangan();
    
    // Show all sections
    document.querySelectorAll('section').forEach(section => {
      section.style.opacity = '1';
      section.style.visibility = 'visible';
    });
    
    console.log('✅ All content rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering content:', error);
  }
}

// ============================================
// 7. INITIALIZE APP
// ============================================
async function initializeApp() {
  console.log('🔄 Initializing app...');
  
  // Tampilkan loading
  const sections = ['fotoTerbaruGrid', 'kenanganPreview', 'strukturGrid'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = `
        <div style="text-align:center;padding:40px;">
          <div class="spinner" style="border:3px solid rgba(255,255,255,0.1);border-top:3px solid #38bdf8;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 15px;"></div>
          <p style="color:#64748b">Memuat data...</p>
        </div>
      `;
    }
  });
  
  // Tunggu Firebase ready
  let attempts = 0;
  while (!window.db && attempts < 20) {
    console.log(`⏳ Waiting for Firebase... (${attempts + 1}/20)`);
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (!window.db) {
    console.warn('⚠️ Firebase not ready, trying Data.js fallback...');
    
    // Coba pakai Data.js
    setTimeout(() => {
      const dataJSExists = checkDataJS();
      
      if (dataJSExists) {
        console.log('✅ Using Data.js as fallback');
        renderAllContent();
      } else {
        console.error('❌ No data source available!');
        sections.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = `
              <div style="text-align:center;padding:40px;color:#ef4444;background:rgba(239,68,68,0.1);border-radius:12px;margin:20px;">
                <h3 style="margin-bottom:15px;">❌ Data Tidak Tersedia</h3>
                <p style="color:#94a3b8;margin-bottom:15px;">Tidak dapat memuat data dari Firebase maupun Data.js</p>
                <p style="color:#64748b;font-size:14px;">Solusi:</p>
                <ol style="text-align:left;max-width:400px;margin:15px auto;color:#64748b;font-size:14px;">
                  <li>Pastikan koneksi internet stabil</li>
                  <li>Generate file Data.js dari Admin Dashboard</li>
                  <li>Upload Data.js ke hosting</li>
                  <li>Refresh halaman (Ctrl+Shift+R)</li>
                </ol>
              </div>
            `;
          }
        });
      }
      
      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      });
    }, 500);
    
    return;
  }
  
  // Firebase ready, load data
  console.log('📡 Firebase ready, loading data...');
  const firebaseSuccess = await loadDataFromFirebase();
  
  if (firebaseSuccess) {
    console.log('✅ Using Firebase data (real-time)');
    renderAllContent();
  } else {
    console.warn('⚠️ Firebase failed, trying Data.js fallback...');
    
    setTimeout(() => {
      const dataJSExists = checkDataJS();
      
      if (dataJSExists) {
        console.log('✅ Using Data.js as fallback');
        renderAllContent();
      } else {
        console.error('❌ Both Firebase and Data.js failed!');
        sections.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.innerHTML = '<p style="text-align:center;padding:20px;color:#ef4444">❌ Gagal memuat data</p>';
          }
        });
      }
      
      document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '1';
        section.style.visibility = 'visible';
      });
    }, 500);
  }
}

// ============================================
// 8. START APP
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM Content Loaded');
  initializeApp();
});

// ============================================
// 9. LOADING SCREEN
// ============================================
window.addEventListener('load', function() {
  setTimeout(() => {
    const loading = document.getElementById('globalLoading');
    if (loading) {
      loading.style.opacity = '0';
      setTimeout(() => loading.style.display = 'none', 300);
    }
  }, 500);
});

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

console.log('✅ main.js loaded successfully');

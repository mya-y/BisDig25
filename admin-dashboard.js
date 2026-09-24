// js/admin-dashboard.js - REBUILT VERSION .

// ============================================
// GLOBAL VARIABLES
// ============================================
let today = new Date().toISOString().split('T')[0];

// Menyimpan collection & id dokumen yang lagi diedit (null = mode tambah baru)
let editState = { collection: null, id: null };

// Konfigurasi tiap modal: dipakai buat ganti judul modal & reset state pas ditutup
const MODAL_CONFIG = {
  modalGaleri:   { collection: 'galeri',   addTitle: 'Tambah Galeri',   editTitle: 'Edit Galeri',   fileInput: 'gFile', fileRequired: true },
  modalJadwal:   { collection: 'jadwal',   addTitle: 'Tambah Jadwal',   editTitle: 'Edit Jadwal',   fileInput: null,    fileRequired: false },
  modalTugas:    { collection: 'tugas',    addTitle: 'Tambah Tugas',    editTitle: 'Edit Tugas',    fileInput: null,    fileRequired: false },
  modalPrestasi: { collection: 'prestasi', addTitle: 'Tambah Prestasi', editTitle: 'Edit Prestasi', fileInput: 'pFile', fileRequired: false },
  modalStruktur: { collection: 'struktur', addTitle: 'Tambah Anggota',  editTitle: 'Edit Anggota',  fileInput: 'sFile', fileRequired: false }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showLoading(text = 'Memproses...') {
  const loadingText = document.getElementById('loadingText');
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  if (loadingText && loadingOverlay) {
    loadingText.textContent = text;
    loadingOverlay.style.display = 'flex';
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

function showModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('show');
    
    // Set tanggal hari ini untuk input date
    const dateInputs = modal.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
      if (input && !input.value) {
        input.value = today;
      }
    });
  }
}

function hideModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
    
    // Reset semua input di modal
    const inputs = modal.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type === 'file') {
        input.value = '';
      } else if (input.type === 'text' || input.type === 'textarea' || 
                 input.type === 'url' || input.type === 'number') {
        input.value = '';
      } else if (input.type === 'select-one') {
        input.selectedIndex = 0;
      } else if (input.type === 'date') {
        input.value = today;
      }
    });
    
    // Reset mode edit -> balik ke mode tambah baru
    const config = MODAL_CONFIG[id];
    if (config) {
      if (editState.collection === config.collection) {
        editState = { collection: null, id: null };
      }
      const titleEl = modal.querySelector('.modal-header h3');
      if (titleEl) titleEl.textContent = config.addTitle;
      if (config.fileInput) {
        const fileEl = document.getElementById(config.fileInput);
        if (fileEl) fileEl.required = config.fileRequired;
      }
    }
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
}

function logout() {
  localStorage.removeItem('admin_auth');
  window.location.href = 'admin.html';
}

// ============================================
// CLOUDINARY UPLOAD
// ============================================

async function uploadToCloudinary(file) {
  if (!file || !window.CLOUD_NAME || !window.CLOUD_PRESET) {
    throw new Error('Konfigurasi Cloudinary tidak ditemukan');
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', window.CLOUD_PRESET);
  
  const fileSize = Math.round(file.size / 1024);
  const fileType = file.type.startsWith('image') ? 'Foto' : 'Video';
  showLoading(`Mengupload ${fileType}... (${fileSize} KB)`);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${window.CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('Cloudinary error:', data);
      throw new Error(data.error?.message || `Upload gagal (${response.status})`);
    }

    console.log('✅ Upload success:', data.secure_url);
    return data.secure_url;
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Gagal upload: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// NAVIGATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 Admin Dashboard loaded');
  
  // Setup navigation
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      
      // Update active nav
      navItems.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      // Show section
      sections.forEach(section => {
        section.style.display = 'none';
      });
      
      const targetSection = document.getElementById(`${sectionId}-section`);
      if (targetSection) {
        targetSection.style.display = 'block';
      }
      
      // Load data for section
      if (sectionId !== 'dashboard' && sectionId !== 'generate') {
        loadSectionData(sectionId);
      }
      
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        toggleSidebar();
      }
    });
  });
  
  // Load dashboard data
  setTimeout(() => {
    if (window.firestore && window.db) {
      console.log('✅ Firebase ready, loading dashboard...');
      loadDashboardStats();
      loadRecentActivity();
    } else {
      console.error('❌ Firebase not initialized');
      showErrorMessage('Firebase gagal diinisialisasi. Coba refresh halaman.');
    }
  }, 1000);
});

function showErrorMessage(message) {
  alert(`❌ Error: ${message}`);
}

// ============================================
// LOAD DASHBOARD DATA
// ============================================

async function loadDashboardStats() {
  console.log('📊 Loading dashboard stats...');
  
  try {
    // Ambil semua koleksi
    const collections = ['galeri', 'jadwal', 'tugas', 'prestasi', 'struktur'];
    
    // Cek firestore tersedia
    if (!window.firestore || !window.db) {
      throw new Error('Firestore tidak tersedia');
    }
    
    const promises = collections.map(col => {
      const collectionRef = window.firestore.collection(window.db, col);
      return window.firestore.getDocs(collectionRef);
    });
    
    const snapshots = await Promise.all(promises);
    
    // 1. GALERI - Filter hanya yang punya URL valid
    const galeriDocs = snapshots[0].docs;
    const validGaleri = galeriDocs.filter(doc => {
      const data = doc.data();
      return data.url && data.url.startsWith('http');
    });
    
    document.getElementById('stat-galeri').textContent = validGaleri.length;
    
    // Hitung galeri hari ini
    const todayStr = new Date().toISOString().split('T')[0];
    const galeriToday = validGaleri.filter(doc => {
      const data = doc.data();
      const docDate = data.tanggal || 
                     (data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : '');
      return docDate === todayStr;
    }).length;
    
    document.getElementById('stat-galeri-change').textContent = 
      galeriToday > 0 ? `+${galeriToday} hari ini` : 'Belum ada hari ini';
    
    // 2. JADWAL
    const jadwalDocs = snapshots[1].docs;
    document.getElementById('stat-jadwal').textContent = jadwalDocs.length;
    
    const utsCount = jadwalDocs.filter(doc => doc.data().mode === 'uts').length;
    const uasCount = jadwalDocs.filter(doc => doc.data().mode === 'uas').length;
    document.getElementById('stat-jadwal-change').textContent = 
      `UTS: ${utsCount}, UAS: ${uasCount}`;
    
    // 3. TUGAS
    const tugasDocs = snapshots[2].docs;
    document.getElementById('stat-tugas').textContent = tugasDocs.length;
    
    const tugasAktif = tugasDocs.filter(doc => doc.data().status === 'open').length;
    document.getElementById('stat-tugas-change').textContent = 
      `Dibuka: ${tugasAktif}, Ditutup: ${tugasDocs.length - tugasAktif}`;
    
    // 4. PRESTASI
    const prestasiDocs = snapshots[3].docs;
    document.getElementById('stat-prestasi').textContent = prestasiDocs.length;
    
    // Hitung prestasi bulan ini
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const prestasiThisMonth = prestasiDocs.filter(doc => {
      const data = doc.data();
      if (!data.tanggal && !data.timestamp) return false;
      
      try {
        const dateStr = data.tanggal || data.timestamp.toDate().toISOString().split('T')[0];
        const [year, month] = dateStr.split('-');
        return parseInt(year) === currentYear && (parseInt(month) - 1) === currentMonth;
      } catch {
        return false;
      }
    }).length;
    
    document.getElementById('stat-prestasi-change').textContent = 
      prestasiThisMonth > 0 ? `+${prestasiThisMonth} bulan ini` : 'Belum ada bulan ini';
    
    console.log('✅ Stats loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading stats:', error);
    document.getElementById('stat-galeri').textContent = '0';
    document.getElementById('stat-jadwal').textContent = '0';
    document.getElementById('stat-tugas').textContent = '0';
    document.getElementById('stat-prestasi').textContent = '0';
  }
}

async function loadRecentActivity() {
  console.log('📈 Loading recent activity...');
  const container = document.getElementById('recent-activity');
  
  if (!container) {
    console.error('❌ Recent activity container not found');
    return;
  }
  
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat aktivitas...</div>';
  
  try {
    // Cek firestore
    if (!window.firestore || !window.db) {
      throw new Error('Firestore tidak tersedia');
    }
    
    // Ambil dari galeri dan prestasi
    const galeriQuery = window.firestore.query(
      window.firestore.collection(window.db, 'galeri'),
      window.firestore.orderBy('timestamp', 'desc'),
      window.firestore.limit(3)
    );
    
    const prestasiQuery = window.firestore.query(
      window.firestore.collection(window.db, 'prestasi'),
      window.firestore.orderBy('timestamp', 'desc'),
      window.firestore.limit(2)
    );
    
    const [galeriSnap, prestasiSnap] = await Promise.all([
      window.firestore.getDocs(galeriQuery),
      window.firestore.getDocs(prestasiQuery)
    ]);
    
    let allActivities = [];
    
    // Process galeri
    galeriSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.url && data.url.startsWith('http')) { // Hanya yang valid
        allActivities.push({
          type: 'galeri',
          icon: data.type === 'video' ? '🎥' : '📸',
          title: data.title || 'Tanpa judul',
          date: data.tanggal || (data.timestamp ? data.timestamp.toDate().toLocaleDateString('id-ID') : ''),
          category: data.category || 'galeri'
        });
      }
    });
    
    // Process prestasi
    prestasiSnap.docs.forEach(doc => {
      const data = doc.data();
      allActivities.push({
        type: 'prestasi',
        icon: '🏆',
        title: data.title || 'Tanpa judul',
        date: data.tanggal || data.date || (data.timestamp ? data.timestamp.toDate().toLocaleDateString('id-ID') : ''),
        category: 'prestasi'
      });
    });
    
    // Sort by date (newest first)
    allActivities.sort((a, b) => {
      try {
        return new Date(b.date) - new Date(a.date);
      } catch {
        return 0;
      }
    });
    
    // Take only 5 most recent
    allActivities = allActivities.slice(0, 5);
    
    if (allActivities.length === 0) {
      container.innerHTML = '<p class="no-data">Belum ada aktivitas</p>';
      return;
    }
    
    // Render activities
    let html = '';
    allActivities.forEach(activity => {
      html += `
        <div class="data-item">
          <div class="data-item-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 20px;">${activity.icon}</span>
              <div>
                <div class="data-item-title">${activity.title}</div>
                <div style="font-size: 12px; color: #64748b;">
                  ${activity.date} • ${activity.type}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
    console.log('✅ Recent activity loaded');
    
  } catch (error) {
    console.error('❌ Error loading recent activity:', error);
    container.innerHTML = '<p class="no-data">Error memuat aktivitas</p>';
  }
}

// ============================================
// LOAD SECTION DATA
// ============================================

async function loadSectionData(section) {
  console.log(`📂 Loading ${section} data...`);
  
  const container = document.getElementById(`${section}-data`);
  if (!container) {
    console.error(`❌ Container for ${section} not found`);
    return;
  }
  
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat data...</div>';
  
  try {
    if (!window.firestore || !window.db) {
      throw new Error('Firestore tidak tersedia');
    }
    
    let query = window.firestore.collection(window.db, section);
    
    // Apply ordering based on section
    if (section === 'galeri' || section === 'prestasi') {
      query = window.firestore.query(
        query,
        window.firestore.orderBy('timestamp', 'desc')
      );
    } else {
      query = window.firestore.query(
        query,
        window.firestore.orderBy('timestamp', 'desc')
      );
    }
    
    const snapshot = await window.firestore.getDocs(query);
    
    if (snapshot.empty) {
      container.innerHTML = '<p class="no-data">Belum ada data</p>';
      return;
    }
    
    // Filter out invalid data for galeri
    let docs = snapshot.docs;
    if (section === 'galeri') {
      docs = docs.filter(doc => {
        const data = doc.data();
        return data.url && data.url.startsWith('http');
      });
      
      if (docs.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada data galeri yang valid</p>';
        return;
      }
    }
    
    // Render berdasarkan section
    let html = '';
    
    if (section === 'galeri') {
      html = docs.map(doc => {
        const data = doc.data();
        const tanggal = data.tanggal || 
                       (data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : 'Tanpa tanggal');
        
        return `
          <div class="data-item">
            <div class="data-item-header">
              <div class="data-item-title">${data.title || 'Tanpa judul'}</div>
              <div class="data-item-actions">
                <button class="btn-icon" onclick="editItem('galeri', '${doc.id}')">✏️</button>
                <button class="btn-icon" onclick="deleteItem('galeri', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">
              <span class="date-badge">📅 ${tanggal}</span>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 10px;">
              📁 ${data.category || 'foto-terbaru'} • ${data.type === 'video' ? '🎥 Video' : '📸 Foto'}
            </div>
            ${data.caption ? `<p style="margin: 10px 0;">${data.caption}</p>` : ''}
            <div style="margin-top: 10px;">
              <a href="${data.url}" target="_blank" style="color: #2563eb; font-size: 14px;">🔗 Lihat file</a>
            </div>
          </div>
        `;
      }).join('');
    }
    else if (section === 'jadwal') {
      html = docs.map(doc => {
        const data = doc.data();
        const modeBadge = data.mode === 'uts' ? '📝 UTS' : 
                         data.mode === 'uas' ? '📖 UAS' : '📚 Reguler';
        
        return `
          <div class="data-item">
            <div class="data-item-header">
              <div class="data-item-title">${data.matkul || 'Tanpa mata kuliah'}</div>
              <div class="data-item-actions">
                <button class="btn-icon" onclick="editItem('jadwal', '${doc.id}')">✏️</button>
                <button class="btn-icon" onclick="deleteItem('jadwal', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px;">
              📅 ${data.hari || '-'} • ⏰ ${data.time || '-'}<br>
              🏫 ${data.ruangan || '-'} • 👨‍🏫 ${data.dosen || '-'}<br>
              <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                ${modeBadge}
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
    else if (section === 'tugas') {
      html = docs.map(doc => {
        const data = doc.data();
        const statusClass = data.status === 'open' ? 'status-open' : 'status-closed';
        const statusText = data.status === 'open' ? '📂 Dibuka' : '🔒 Ditutup';
        
        return `
          <div class="data-item">
            <div class="data-item-header">
              <div class="data-item-title">${data.icon || '📝'} ${data.title || 'Tanpa judul'}</div>
              <div class="data-item-actions">
                <button class="btn-icon" onclick="editItem('tugas', '${doc.id}')">✏️</button>
                <button class="btn-icon" onclick="deleteItem('tugas', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px;">
              📚 ${data.matkul || '-'}<br>
              ⏰ ${data.deadline || '-'}<br>
              <span class="${statusClass}" style="display: inline-block; margin-top: 5px; padding: 3px 8px; border-radius: 4px; font-size: 12px;">
                ${statusText}
              </span><br>
              <a href="${data.driveLink}" target="_blank" style="color: #2563eb; font-size: 12px;">🔗 Link Drive</a>
            </div>
          </div>
        `;
      }).join('');
    }
    else if (section === 'prestasi') {
      html = docs.map(doc => {
        const data = doc.data();
        const tanggal = data.tanggal || data.date || 
                       (data.timestamp ? data.timestamp.toDate().toISOString().split('T')[0] : 'Tanpa tanggal');
        const badge = getPrestasiBadge(data.title);
        
        return `
          <div class="data-item">
            <div class="data-item-header">
              <div class="data-item-title">${badge} ${data.title || 'Tanpa judul'}</div>
              <div class="data-item-actions">
                <button class="btn-icon" onclick="editItem('prestasi', '${doc.id}')">✏️</button>
                <button class="btn-icon" onclick="deleteItem('prestasi', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">
              <span class="date-badge">📅 ${tanggal}</span>
            </div>
            ${data.caption ? `<p style="margin: 10px 0;">${data.caption}</p>` : ''}
            ${data.url ? `<div style="margin-top: 10px;">
              <a href="${data.url}" target="_blank" style="color: #2563eb; font-size: 14
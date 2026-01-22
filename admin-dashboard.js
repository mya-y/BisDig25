// js/admin-dashboard.js - REBUILT VERSION

// ============================================
// GLOBAL VARIABLES
// ============================================
let today = new Date().toISOString().split('T')[0];

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
                <button class="btn-icon" onclick="deleteItem('prestasi', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">
              <span class="date-badge">📅 ${tanggal}</span>
            </div>
            ${data.caption ? `<p style="margin: 10px 0;">${data.caption}</p>` : ''}
            ${data.url ? `<div style="margin-top: 10px;">
              <a href="${data.url}" target="_blank" style="color: #2563eb; font-size: 14px;">🔗 Lihat foto</a>
            </div>` : ''}
          </div>
        `;
      }).join('');
    }
    else if (section === 'struktur') {
      html = docs.map(doc => {
        const data = doc.data();
        return `
          <div class="data-item">
            <div class="data-item-header">
              <div class="data-item-title">${data.nama || 'Tanpa nama'}</div>
              <div class="data-item-actions">
                <button class="btn-icon" onclick="deleteItem('struktur', '${doc.id}')">🗑️</button>
              </div>
            </div>
            <div style="color: #64748b; font-size: 14px;">
              ${data.jabatan || '-'}<br>
              ${data.initial ? `Initial: <strong>${data.initial}</strong>` : ''}<br>
              Urutan: ${data.urutan || 999}
            </div>
          </div>
        `;
      }).join('');
    }
    
    container.innerHTML = html;
    console.log(`✅ ${section} data loaded successfully`);
    
  } catch (error) {
    console.error(`❌ Error loading ${section}:`, error);
    container.innerHTML = `<p class="error">Error memuat data: ${error.message}</p>`;
  }
}

function getPrestasiBadge(title) {
  if (!title) return '🏆';
  const lower = title.toLowerCase();
  if (lower.includes('juara 1') || lower.includes('pertama') || lower.includes('1st')) return '🥇';
  if (lower.includes('juara 2') || lower.includes('kedua') || lower.includes('2nd')) return '🥈';
  if (lower.includes('juara 3') || lower.includes('ketiga') || lower.includes('3rd')) return '🥉';
  if (lower.includes('harapan')) return '🎖️';
  if (lower.includes('lomba') || lower.includes('kompetisi')) return '🏅';
  if (lower.includes('akademik')) return '📚';
  return '🏆';
}

// ============================================
// FORM HANDLERS
// ============================================

async function handleGaleriSubmit() {
  const title = document.getElementById('gTitle').value;
  const fileInput = document.getElementById('gFile');
  const tanggal = document.getElementById('gTanggal').value || today;
  
  // Validasi
  if (!title || !title.trim()) {
    alert('❌ Judul harus diisi!');
    return;
  }
  
  if (!fileInput.files[0]) {
    alert('❌ Pilih file foto/video terlebih dahulu!');
    return;
  }
  
  const file = fileInput.files[0];
  if (file.size > 10 * 1024 * 1024) {
    alert('❌ Ukuran file terlalu besar! Maksimal 10MB.');
    return;
  }
  
  showLoading('Menyimpan galeri...');
  
  try {
    // 1. Upload ke Cloudinary
    const url = await uploadToCloudinary(file);
    
    // 2. Simpan ke Firestore
    await window.firestore.addDoc(window.firestore.collection(window.db, 'galeri'), {
      title: title.trim(),
      caption: document.getElementById('gCaption').value.trim(),
      category: document.getElementById('gCategory').value,
      url: url,
      type: file.type.startsWith('video') ? 'video' : 'image',
      tanggal: tanggal,
      timestamp: window.firestore.serverTimestamp()
    });
    
    alert('✅ Galeri berhasil ditambahkan!');
    hideModal('modalGaleri');
    
    // Refresh data
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('galeri');
    
  } catch (error) {
    console.error('❌ Galeri submit error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

async function handleJadwalSubmit() {
  const hari = document.getElementById('jHari').value;
  const matkul = document.getElementById('jMatkul').value;
  const time = document.getElementById('jTime').value;
  
  if (!hari) {
    alert('❌ Pilih hari terlebih dahulu!');
    return;
  }
  
  if (!matkul || !matkul.trim()) {
    alert('❌ Mata kuliah harus diisi!');
    return;
  }
  
  if (!time || !time.trim()) {
    alert('❌ Waktu harus diisi!');
    return;
  }
  
  showLoading('Menyimpan jadwal...');
  
  try {
    await window.firestore.addDoc(window.firestore.collection(window.db, 'jadwal'), {
      hari: hari,
      matkul: matkul.trim(),
      time: time.trim(),
      ruangan: document.getElementById('jRuangan').value.trim() || '-',
      dosen: document.getElementById('jDosen').value.trim() || '-',
      mode: document.getElementById('jMode').value,
      timestamp: window.firestore.serverTimestamp()
    });
    
    alert('✅ Jadwal berhasil ditambahkan!');
    hideModal('modalJadwal');
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('jadwal');
    
  } catch (error) {
    console.error('❌ Jadwal submit error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

async function handleTugasSubmit() {
  const title = document.getElementById('tTitle').value;
  const matkul = document.getElementById('tMatkul').value;
  const deadline = document.getElementById('tDeadline').value;
  const driveLink = document.getElementById('tDriveLink').value;
  
  if (!title || !title.trim()) {
    alert('❌ Judul tugas harus diisi!');
    return;
  }
  
  if (!matkul || !matkul.trim()) {
    alert('❌ Mata kuliah harus diisi!');
    return;
  }
  
  if (!deadline || !deadline.trim()) {
    alert('❌ Deadline harus diisi!');
    return;
  }
  
  if (!driveLink || !driveLink.trim() || !driveLink.includes('drive.google.com')) {
    alert('❌ Link Google Drive harus valid!');
    return;
  }
  
  showLoading('Menyimpan tugas...');
  
  try {
    await window.firestore.addDoc(window.firestore.collection(window.db, 'tugas'), {
      title: title.trim(),
      matkul: matkul.trim(),
      deadline: deadline.trim(),
      driveLink: driveLink.trim(),
      icon: document.getElementById('tIcon').value.trim() || '📝',
      status: document.getElementById('tStatus').value,
      timestamp: window.firestore.serverTimestamp()
    });
    
    alert('✅ Tugas berhasil ditambahkan!');
    hideModal('modalTugas');
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('tugas');
    
  } catch (error) {
    console.error('❌ Tugas submit error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

async function handlePrestasiSubmit() {
  const title = document.getElementById('pTitle').value;
  const tanggal = document.getElementById('pTanggal').value || today;
  
  if (!title || !title.trim()) {
    alert('❌ Judul prestasi harus diisi!');
    return;
  }
  
  showLoading('Menyimpan prestasi...');
  
  try {
    let url = null;
    let type = null;
    const fileInput = document.getElementById('pFile');
    
    if (fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Ukuran file terlalu besar! Maksimal 10MB.');
        return;
      }
      url = await uploadToCloudinary(file);
      type = file.type.startsWith('video') ? 'video' : 'image';
    }
    
    await window.firestore.addDoc(window.firestore.collection(window.db, 'prestasi'), {
      title: title.trim(),
      caption: document.getElementById('pCaption').value.trim(),
      tanggal: tanggal,
      date: tanggal, // Backup field
      url: url,
      type: type,
      timestamp: window.firestore.serverTimestamp()
    });
    
    alert('✅ Prestasi berhasil ditambahkan!');
    hideModal('modalPrestasi');
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('prestasi');
    
  } catch (error) {
    console.error('❌ Prestasi submit error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

async function handleStrukturSubmit() {
  const nama = document.getElementById('sNama').value;
  const jabatan = document.getElementById('sJabatan').value;
  const urutan = document.getElementById('sUrutan').value || 1;
  
  if (!nama || !nama.trim()) {
    alert('❌ Nama harus diisi!');
    return;
  }
  
  if (!jabatan || !jabatan.trim()) {
    alert('❌ Jabatan harus diisi!');
    return;
  }
  
  showLoading('Menyimpan anggota...');
  
  try {
    let url = null;
    const fileInput = document.getElementById('sFile');
    
    if (fileInput.files[0]) {
      const file = fileInput.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ Ukuran file terlalu besar! Maksimal 5MB.');
        return;
      }
      url = await uploadToCloudinary(file);
    }
    
    await window.firestore.addDoc(window.firestore.collection(window.db, 'struktur'), {
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      initial: (document.getElementById('sInitial').value.trim().charAt(0) || nama.trim().charAt(0)).toUpperCase(),
      urutan: parseInt(urutan),
      foto: url,
      timestamp: window.firestore.serverTimestamp()
    });
    
    alert('✅ Anggota berhasil ditambahkan!');
    hideModal('modalStruktur');
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('struktur');
    
  } catch (error) {
    console.error('❌ Struktur submit error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// DELETE FUNCTION
// ============================================

async function deleteItem(collection, id) {
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  
  showLoading('Menghapus data...');
  
  try {
    await window.firestore.deleteDoc(window.firestore.doc(window.db, collection, id));
    alert('✅ Data berhasil dihapus!');
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData(collection);
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    alert(`❌ Gagal menghapus: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// CLEANUP FUNCTIONS
// ============================================

async function cleanupGaleri() {
  if (!confirm('Hapus semua data galeri yang rusak (tidak ada URL)?')) return;
  
  showLoading('Membersihkan data rusak...');
  
  try {
    const snapshot = await window.firestore.getDocs(
      window.firestore.collection(window.db, 'galeri')
    );
    
    const failedDocs = snapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.url || !data.url.startsWith('http');
    });
    
    if (failedDocs.length === 0) {
      alert('✅ Tidak ada data galeri rusak ditemukan.');
      return;
    }
    
    // Hapus semua
    const deletePromises = failedDocs.map(doc => 
      window.firestore.deleteDoc(window.firestore.doc(window.db, 'galeri', doc.id))
    );
    
    await Promise.all(deletePromises);
    
    alert(`✅ Berhasil menghapus ${failedDocs.length} data galeri rusak.`);
    
    await loadDashboardStats();
    await loadRecentActivity();
    loadSectionData('galeri');
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    alert(`❌ Gagal: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// ============================================
// GENERATE DATA.JS
// ============================================

async function generateDataJS() {
  showLoading('Mengambil data dari Firebase...');
  const statusEl = document.getElementById('generate-status');
  if (statusEl) {
    statusEl.innerHTML = '';
  }
  
  try {
    // Ambil semua data
    const collections = ['galeri', 'jadwal', 'tugas', 'prestasi', 'struktur'];
    const promises = collections.map(col => 
      window.firestore.getDocs(window.firestore.collection(window.db, col))
    );
    
    const snapshots = await Promise.all(promises);
    
    // Filter galeri yang valid
    const galeriValid = snapshots[0].docs.filter(doc => {
      const data = doc.data();
      return data.url && data.url.startsWith('http');
    });
    
    // Konversi ke array
    const galeri = galeriValid.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.tanggal || b.timestamp) - new Date(a.tanggal || a.timestamp));
    
    const jadwal = snapshots[1].docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const tugas = snapshots[2].docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const prestasi = snapshots[3].docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.tanggal || b.date || b.timestamp) - new Date(a.tanggal || a.date || a.timestamp));
    
    const struktur = snapshots[4].docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.urutan || 999) - (b.urutan || 999));
    
    // Buat objek data
    const dataObj = {
      galeri: galeri,
      jadwal: jadwal,
      tugas: tugas,
      prestasi: prestasi,
      struktur: struktur,
      generatedAt: new Date().toISOString(),
      // Untuk kompatibilitas dengan kode lama
      prestasiData: prestasi,
      tugasData: tugas,
      jadwalData: jadwal.filter(j => j.mode === 'regular'),
      jadwalUTS: jadwal.filter(j => j.mode === 'uts'),
      jadwalUAS: jadwal.filter(j => j.mode === 'uas')
    };
    
    // Buat file JavaScript
    const jsContent = `// ============================================
// DATA.JS - Generated from Firebase
// Generated: ${new Date().toLocaleString('id-ID')}
// Total Data: Galeri(${galeri.length}), Jadwal(${jadwal.length}), Tugas(${tugas.length}), Prestasi(${prestasi.length}), Struktur(${struktur.length})
// ============================================

const DATA = ${JSON.stringify(dataObj, null, 2)};

// Untuk kompatibilitas dengan kode lama
const prestasiData = DATA.prestasi || [];
const tugasData = DATA.tugas || [];
const jadwalData = DATA.jadwalData || [];
const jadwalUTS = DATA.jadwalUTS || [];
const jadwalUAS = DATA.jadwalUAS || [];

// Export untuk module jika diperlukan
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DATA, prestasiData, tugasData, jadwalData, jadwalUTS, jadwalUAS };
}`;
    
    // Download file
    const blob = new Blob([jsContent], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Data.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; color: #10b981; padding: 15px; border-radius: 8px; margin-top: 20px;">
          ✅ <strong>Data.js berhasil digenerate!</strong><br>
          Total data: Galeri(${galeri.length}), Jadwal(${jadwal.length}), Tugas(${tugas.length})<br>
          File telah didownload. Upload ke folder utama website.
        </div>
      `;
    }
    
  } catch (error) {
    console.error('❌ Generate error:', error);
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #ef4444; padding: 15px; border-radius: 8px; margin-top: 20px;">
          ❌ <strong>Error:</strong> ${error.message}
        </div>
      `;
    }
  } finally {
    hideLoading();
  }
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.showModal = showModal;
window.hideModal = hideModal;
window.toggleSidebar = toggleSidebar;
window.logout = logout;
window.handleGaleriSubmit = handleGaleriSubmit;
window.handleJadwalSubmit = handleJadwalSubmit;
window.handleTugasSubmit = handleTugasSubmit;
window.handlePrestasiSubmit = handlePrestasiSubmit;
window.handleStrukturSubmit = handleStrukturSubmit;
window.deleteItem = deleteItem;
window.generateDataJS = generateDataJS;
window.cleanupGaleri = cleanupGaleri;
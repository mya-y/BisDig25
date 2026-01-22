// Initialize Supabase Client
const supabase = window.supabase.createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_KEY
);

// ============================================
// AUTH & LOGIN
// ============================================

// Check if already logged in
const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
if (isLoggedIn) {
  showDashboard();
}

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  
  if (password === CONFIG.ADMIN_PASSWORD) {
    localStorage.setItem('adminLoggedIn', 'true');
    showDashboard();
  } else {
    document.getElementById('loginError').textContent = 'Password salah!';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('adminLoggedIn');
  location.reload();
});

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminDashboard').style.display = 'grid';
  loadGaleri();
}

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    
    // Update active nav
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Show page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`).classList.add('active');
    
    // Load data
    if (page === 'galeri') loadGaleri();
    if (page === 'jadwal') loadJadwal();
    if (page === 'tugas') loadTugas();
    if (page === 'struktur') loadStruktur();
    if (page === 'prestasi') loadPrestasi();
  });
});

// ============================================
// GALERI FUNCTIONS
// ============================================

async function loadGaleri() {
  showLoading();
  
  try {
    const { data, error } = await supabase
      .from('galeri')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const container = document.getElementById('galeriList');
    document.getElementById('totalGaleri').textContent = data.length;
    
    if (data.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada media</p>';
    } else {
      container.innerHTML = data.map(item => `
        <div class="gallery-item">
          ${item.type === 'video' 
            ? `<video src="${item.url}" controls></video>`
            : `<img src="${item.url}" alt="${item.title}">`
          }
          <div class="gallery-item-info">
            <div class="gallery-item-title">${item.title}</div>
            <div class="gallery-item-meta">
              ${item.category} • ${item.date}
            </div>
            <div class="gallery-item-actions">
              <button class="btn-edit" onclick="editGaleri(${item.id})">Edit</button>
              <button class="btn-delete" onclick="deleteGaleri(${item.id})">Hapus</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    alert('Error loading galeri: ' + error.message);
  } finally {
    hideLoading();
  }
}

document.getElementById('btnAddGaleri').addEventListener('click', () => {
  document.getElementById('galeriId').value = '';
  document.getElementById('formGaleri').reset();
  document.getElementById('modalGaleriTitle').textContent = 'Tambah Foto/Video';
  openModal('modalGaleri');
});

document.getElementById('formGaleri').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();
  
  try {
    const file = document.getElementById('galeriFile').files[0];
    let url = '';
    
    // Upload to Cloudinary if new file
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CONFIG.CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'bd25-galeri');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CONFIG.CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      url = data.secure_url;
    }
    
    const galeriData = {
      title: document.getElementById('galeriTitle').value,
      caption: document.getElementById('galeriCaption').value,
      date: document.getElementById('galeriDate').value,
      category: document.getElementById('galeriCategory').value,
      type: file && file.type.startsWith('video') ? 'video' : 'image'
    };
    
    if (url) galeriData.url = url;
    
    const id = document.getElementById('galeriId').value;
    
    if (id) {
      // Update
      const { error } = await supabase
        .from('galeri')
        .update(galeriData)
        .eq('id', id);
      
      if (error) throw error;
    } else {
      // Insert
      galeriData.url = url;
      const { error } = await supabase
        .from('galeri')
        .insert([galeriData]);
      
      if (error) throw error;
    }
    
    closeModal('modalGaleri');
    loadGaleri();
    alert('Berhasil menyimpan!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
});

async function deleteGaleri(id) {
  if (!confirm('Yakin ingin menghapus?')) return;
  
  showLoading();
  try {
    const { error } = await supabase
      .from('galeri')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    loadGaleri();
    alert('Berhasil menghapus!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// JADWAL FUNCTIONS
// ============================================

let currentJadwalMode = 'regular';

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentJadwalMode = btn.dataset.mode;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadJadwal();
  });
});

async function loadJadwal() {
  showLoading();
  
  try {
    const { data, error } = await supabase
      .from('jadwal')
      .select('*')
      .eq('mode', currentJadwalMode)
      .order('hari');
    
    if (error) throw error;
    
    const container = document.getElementById('jadwalList');
    
    if (data.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada jadwal</p>';
    } else {
      container.innerHTML = data.map(item => `
        <div class="list-item">
          <div class="list-item-header">
            <div>
              <div class="list-item-title">${item.matkul}</div>
              <div class="list-item-meta">
                ${item.hari} • ${item.time} • ${item.ruangan}
                ${item.dosen ? ` • ${item.dosen}` : ''}
              </div>
            </div>
            <div class="list-item-actions">
              <button class="btn-edit" onclick="editJadwal(${item.id})">Edit</button>
              <button class="btn-delete" onclick="deleteJadwal(${item.id})">Hapus</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

document.getElementById('btnAddJadwal').addEventListener('click', () => {
  document.getElementById('jadwalId').value = '';
  document.getElementById('formJadwal').reset();
  document.getElementById('jadwalMode').value = currentJadwalMode;
  openModal('modalJadwal');
});

document.getElementById('formJadwal').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();
  
  try {
    const jadwalData = {
      hari: document.getElementById('jadwalHari').value,
      matkul: document.getElementById('jadwalMatkul').value,
      time: document.getElementById('jadwalTime').value,
      ruangan: document.getElementById('jadwalRuangan').value,
      dosen: document.getElementById('jadwalDosen').value,
      mode: document.getElementById('jadwalMode').value
    };
    
    const id = document.getElementById('jadwalId').value;
    
    if (id) {
      const { error } = await supabase.from('jadwal').update(jadwalData).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('jadwal').insert([jadwalData]);
      if (error) throw error;
    }
    
    closeModal('modalJadwal');
    loadJadwal();
    alert('Berhasil menyimpan!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
});

async function deleteJadwal(id) {
  if (!confirm('Yakin ingin menghapus?')) return;
  showLoading();
  
  try {
    const { error } = await supabase.from('jadwal').delete().eq('id', id);
    if (error) throw error;
    
    loadJadwal();
    alert('Berhasil menghapus!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// TUGAS FUNCTIONS
// ============================================

async function loadTugas() {
  showLoading();
  
  try {
    const { data, error } = await supabase
      .from('tugas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const container = document.getElementById('tugasList');
    
    if (data.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada tugas</p>';
    } else {
      container.innerHTML = data.map(item => `
        <div class="list-item">
          <div class="list-item-header">
            <div>
              <div class="list-item-title">${item.icon} ${item.title}</div>
              <div class="list-item-meta">
                ${item.matkul} • Deadline: ${item.deadline}
                <br>Status: ${item.status === 'open' ? '📂 Dibuka' : '🔒 Ditutup'}
              </div>
            </div>
            <div class="list-item-actions">
              <button class="btn-edit" onclick="editTugas(${item.id})">Edit</button>
              <button class="btn-delete" onclick="deleteTugas(${item.id})">Hapus</button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

document.getElementById('btnAddTugas').addEventListener('click', () => {
  document.getElementById('tugasId').value = '';
  document.getElementById('formTugas').reset();
  openModal('modalTugas');
});

document.getElementById('formTugas').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoading();
  
  try {
    const tugasData = {
      title: document.getElementById('tugasTitle').value,
      matkul: document.getElementById('tugasMatkul').value,
      deadline: document.getElementById('tugasDeadline').value,
      drive_link: document.getElementById('tugasDriveLink').value,
      status: document.getElementById('tugasStatus').value,
      icon: document.getElementById('tugasIcon').value
    };
    
    const id = document.getElementById('tugasId').value;
    
    if (id) {
      const { error } = await supabase.from('tugas').update(tugasData).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('tugas').insert([tugasData]);
      if (error) throw error;
    }
    
    closeModal('modalTugas');
    loadTugas();
    alert('Berhasil menyimpan!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
});

async function deleteTugas(id) {
  if (!confirm('Yakin ingin menghapus?')) return;
  showLoading();
  
  try {
    const { error } = await supabase.from('tugas').delete().eq('id', id);
    if (error) throw error;
    
    loadTugas();
    alert('Berhasil menghapus!');
  } catch (error) {
    alert('Error: ' + error.message);
  } finally {
    hideLoading();
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function openModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

function showLoading() {
  document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}
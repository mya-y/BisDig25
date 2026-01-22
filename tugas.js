// js/tugas.js - Untuk tugas.html

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Loading tugas page...');
  
  // ============================================
  // LOAD DATA FUNCTIONS
  // ============================================
  
  async function loadFromFirebase() {
    try {
      console.log('Mencoba load dari Firebase...');
      
      const snapshot = await window.firestore.getDocs(
        window.firestore.collection(window.db, 'tugas')
      );
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
    } catch (error) {
      console.error('Error loading from Firebase:', error);
      return null;
    }
  }
  
  function loadFromDataJS() {
    console.log('Mencoba load dari Data.js...');
    
    if (typeof DATA !== 'undefined') {
      return DATA.tugasData || DATA.tugas || [];
    }
    return null;
  }
  
  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  function renderTugas(tugas) {
    const container = document.getElementById('tugasGrid');
    if (!container) return;
    
    // Filter berdasarkan status
    let filtered = tugas;
    if (currentFilter === 'open') {
      filtered = tugas.filter(item => item.status === 'open');
    } else if (currentFilter === 'closed') {
      filtered = tugas.filter(item => item.status === 'closed');
    }
    
    // Urutkan: yang open dulu, lalu deadline terdekat
    filtered.sort((a, b) => {
      // Status open lebih dulu
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      
      // Lalu urutkan berdasarkan deadline
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });
    
    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#64748b;grid-column:1/-1;">
          <div style="font-size:48px;margin-bottom:10px;">📂</div>
          <p>Tidak ada tugas di kategori ini</p>
          <p style="font-size:14px;color:#94a3b8;">Admin dapat menambah tugas di dashboard</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filtered.map((item, index) => {
      const statusClass = item.status === 'open' ? 'status-open' : 'status-closed';
      const statusText = item.status === 'open' ? '📂 Dibuka' : '🔒 Ditutup';
      const btnText = item.status === 'open' ? '📤 Kumpul Tugas' : '🔒 Sudah Ditutup';
      const btnClass = item.status === 'open' ? 'btn-kumpul' : 'btn-kumpul disabled';
      
      return `
        <div class="tugas-card ${item.status === 'closed' ? 'closed' : ''}" 
             style="opacity:0;transform:translateY(10px);animation:fadeIn 0.3s ease forwards ${index * 0.05}s">
          <div class="tugas-icon">${item.icon || '📝'}</div>
          <div class="tugas-content">
            <div class="tugas-title">${item.title}</div>
            <div class="tugas-meta">${item.matkul}</div>
            <div class="tugas-deadline">⏰ Deadline: ${item.deadline}</div>
            <div class="tugas-status ${statusClass}">${statusText}</div>
            ${item.status === 'open' 
              ? `<a href="${item.driveLink}" target="_blank" class="${btnClass}">${btnText}</a>`
              : `<button class="${btnClass}" disabled>${btnText}</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }
  
  function filterTugas(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const clickedTab = event.target;
    clickedTab.classList.add('active');
    
    // Reload data dengan filter baru
    loadAndRender();
  }
  
  // ============================================
  // MAIN LOADING LOGIC
  // ============================================
  
  async function loadAndRender() {
    try {
      let tugas = null;
      
      // Coba load dari Firebase dulu
      if (window.firestore) {
        tugas = await loadFromFirebase();
      }
      
      // Jika Firebase gagal, coba dari Data.js
      if (!tugas) {
        tugas = loadFromDataJS();
      }
      
      // Jika masih tidak ada data, tampilkan error
      if (!tugas) {
        console.error('Tidak bisa load data dari mana pun');
        return;
      }
      
      renderTugas(tugas);
      
    } catch (error) {
      console.error('Error loading tugas:', error);
      const container = document.getElementById('tugasGrid');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center;padding:40px;color:#f87171;grid-column:1/-1;">
            <p>Error: ${error.message}</p>
          </div>
        `;
      }
    }
  }
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  try {
    // Setup event listeners untuk filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const status = this.getAttribute('onclick').match(/'(\w+)'/)[1];
        filterTugas(status);
      });
    });
    
    // Load dan render data awal
    await loadAndRender();
    
    console.log('✅ Tugas page loaded successfully');
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
  } catch (error) {
    console.error('Error initializing tugas page:', error);
  }
  
  // ============================================
  // EXPORT FUNCTIONS GLOBALLY
  // ============================================
  window.filterTugas = filterTugas;
});
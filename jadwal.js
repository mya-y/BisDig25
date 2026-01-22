// js/jadwal.js - Untuk jadwal.html

let currentDay = 'senin';
let currentMode = 'regular';

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Loading jadwal page...');
  
  // ============================================
  // LOAD DATA FUNCTIONS
  // ============================================
  
  async function loadFromFirebase() {
    try {
      console.log('Mencoba load dari Firebase...');
      
      const snapshot = await window.firestore.getDocs(
        window.firestore.collection(window.db, 'jadwal')
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
      // Untuk kompatibilitas dengan struktur data lama
      if (currentMode === 'uts') {
        return DATA.jadwalUTS || [];
      } else if (currentMode === 'uas') {
        return DATA.jadwalUAS || [];
      } else {
        return DATA.jadwalData || DATA.jadwal || [];
      }
    }
    return null;
  }
  
  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  function renderSchedule(jadwal) {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    
    // Filter berdasarkan mode dan hari
    let filtered = jadwal.filter(item => {
      // Filter mode
      if (currentMode === 'uts' && item.mode !== 'uts') return false;
      if (currentMode === 'uas' && item.mode !== 'uas') return false;
      if (currentMode === 'regular' && item.mode !== 'regular') return false;
      
      // Filter hari (case insensitive)
      return item.hari && item.hari.toLowerCase() === currentDay;
    });
    
    // Urutkan berdasarkan waktu
    filtered.sort((a, b) => {
      const timeA = a.time ? a.time.split('-')[0].trim() : '';
      const timeB = b.time ? b.time.split('-')[0].trim() : '';
      return timeA.localeCompare(timeB);
    });
    
    if (filtered.length === 0) {
      const modeText = currentMode === 'uts' ? 'UTS' : 
                      currentMode === 'uas' ? 'UAS' : 'kuliah';
      const dayText = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
      
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#64748b;">
          <div style="font-size:48px;margin-bottom:10px;">📅</div>
          <p>Tidak ada jadwal ${modeText} hari ${dayText}</p>
          <p style="font-size:14px;color:#94a3b8;">Libur atau belum ada jadwal</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = filtered.map(item => {
      const isExam = currentMode === 'uts' || currentMode === 'uas';
      const badge = isExam 
        ? `<div style="background:${currentMode === 'uts' ? '#f59e0b20' : '#ef444420'}; 
            color:${currentMode === 'uts' ? '#f59e0b' : '#ef4444'}; 
            padding:4px 8px; border-radius:4px; font-size:12px; 
            display:inline-block; margin-bottom:8px;">
            ${currentMode === 'uts' ? '📝 UTS' : '📖 UAS'}
          </div>` 
        : '';
      
      return `
        <div class="schedule-item ${isExam ? 'exam' : ''}" 
             style="opacity:0;transform:translateY(10px);animation:fadeIn 0.3s ease forwards">
          ${badge}
          <div class="schedule-time">🕐 ${item.time}</div>
          <div class="schedule-matkul">${item.matkul}</div>
          <div class="schedule-meta">
            <span>📍 ${item.ruangan}</span>
            ${item.dosen ? `<span>👨‍🏫 ${item.dosen}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
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
      
      .schedule-item {
        animation-delay: calc(var(--index) * 0.1s);
      }
    `;
    document.head.appendChild(style);
    
    // Set animation delay for each item
    const items = container.querySelectorAll('.schedule-item');
    items.forEach((item, index) => {
      item.style.setProperty('--index', index);
    });
  }
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  function changeMode(mode) {
    currentMode = mode;
    
    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    const clickedBtn = event.target;
    clickedBtn.classList.add('active');
    
    // Reload data dengan mode baru
    loadAndRender();
  }
  
  function showDay(day) {
    currentDay = day.toLowerCase();
    
    // Update active tab
    document.querySelectorAll('.day-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const clickedTab = event.target;
    clickedTab.classList.add('active');
    
    // Render schedule dengan hari baru
    loadAndRender();
  }
  
  async function loadAndRender() {
    try {
      let jadwal = null;
      
      // Coba load dari Firebase dulu
      if (window.firestore) {
        jadwal = await loadFromFirebase();
      }
      
      // Jika Firebase gagal, coba dari Data.js
      if (!jadwal) {
        jadwal = loadFromDataJS();
      }
      
      // Jika masih tidak ada data, tampilkan error
      if (!jadwal) {
        console.error('Tidak bisa load data dari mana pun');
        return;
      }
      
      renderSchedule(jadwal);
      
    } catch (error) {
      console.error('Error loading schedule:', error);
      const container = document.getElementById('scheduleContainer');
      if (container) {
        container.innerHTML = `
          <div style="text-align:center;padding:40px;color:#f87171;">
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
    // Setup event listeners untuk tombol
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const mode = this.getAttribute('onclick').match(/'(\w+)'/)[1];
        changeMode(mode);
      });
    });
    
    document.querySelectorAll('.day-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        const day = this.getAttribute('onclick').match(/'(\w+)'/)[1];
        showDay(day);
      });
    });
    
    // Load dan render data awal
    await loadAndRender();
    
    console.log('✅ Jadwal page loaded successfully');
    
  } catch (error) {
    console.error('Error initializing jadwal page:', error);
  }
  
  // ============================================
  // EXPORT FUNCTIONS GLOBALLY
  // ============================================
  window.changeMode = changeMode;
  window.showDay = showDay;
});
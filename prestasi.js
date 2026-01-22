// js/prestasi.js - Untuk prestasi.html

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Loading prestasi page...');
  
  // ============================================
  // LOAD DATA FUNCTIONS
  // ============================================
  
  async function loadFromFirebase() {
    try {
      console.log('Mencoba load dari Firebase...');
      
      // Query dengan sorting berdasarkan tanggal (terbaru dulu)
      const q = window.firestore.query(
        window.firestore.collection(window.db, 'prestasi'),
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
    
    if (typeof DATA !== 'undefined') {
      // Sort berdasarkan tanggal (terbaru dulu)
      const prestasi = DATA.prestasi || DATA.prestasiData || [];
      return prestasi.sort((a, b) => {
        const dateA = new Date(a.tanggal || a.date || a.timestamp || 0);
        const dateB = new Date(b.tanggal || b.date || b.timestamp || 0);
        return dateB - dateA;
      });
    }
    return null;
  }
  
  // ============================================
  // RENDER FUNCTIONS
  // ============================================
  
  function renderPrestasi(prestasi) {
    const container = document.getElementById('prestasiTimeline');
    if (!container) return;
    
    if (!prestasi || prestasi.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#64748b;">
          <div style="font-size:48px;margin-bottom:10px;">🏆</div>
          <p>Belum ada prestasi yang ditambahkan</p>
          <p style="font-size:14px;color:#94a3b8;">Admin dapat menambah prestasi di dashboard</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = prestasi.map((item, index) => {
      const tanggal = item.tanggal || item.date;
      const formattedDate = tanggal ? formatTanggal(tanggal) : '';
      const badge = getBadgeEmoji(item.title);
      
      const mediaElement = item.url ? (
        item.type === 'video' 
          ? `<video src="${item.url}" controls style="width:100%;border-radius:8px;margin-top:10px;"></video>`
          : `<img src="${item.url}" alt="${item.title}" loading="lazy" style="width:100%;border-radius:8px;margin-top:10px;">`
      ) : '';
      
      return `
        <div class="timeline-item" style="opacity:0;transform:translateY(20px);animation:fadeInUp 0.5s ease forwards ${index * 0.1}s">
          <div class="timeline-dot" style="background:${getBadgeColor(item.title)}"></div>
          <div class="achievement-card">
            <div class="achievement-header">
              <span class="achievement-badge" style="background:${getBadgeColor(item.title)}20;color:${getBadgeColor(item.title)}">
                ${badge}
              </span>
              ${formattedDate ? `<span class="achievement-date">📅 ${formattedDate}</span>` : ''}
            </div>
            <h3 class="achievement-title">${item.title}</h3>
            ${item.caption ? `<p class="achievement-description">${item.caption}</p>` : ''}
            ${mediaElement}
          </div>
        </div>
      `;
    }).join('');
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
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
  
  function getBadgeEmoji(title) {
    if (!title) return '🏆';
    const lower = title.toLowerCase();
    if (lower.includes('juara 1') || lower.includes('juara pertama') || lower.includes('1st')) return '🥇';
    if (lower.includes('juara 2') || lower.includes('juara kedua') || lower.includes('2nd')) return '🥈';
    if (lower.includes('juara 3') || lower.includes('juara ketiga') || lower.includes('3rd')) return '🥉';
    if (lower.includes('harapan')) return '🎖️';
    if (lower.includes('kompetisi') || lower.includes('lomba')) return '🏅';
    if (lower.includes('akademik') || lower.includes('nilai')) return '📚';
    if (lower.includes('olahraga') || lower.includes('basket') || lower.includes('futsal')) return '⚽';
    if (lower.includes('seni') || lower.includes('musik') || lower.includes('tari')) return '🎨';
    if (lower.includes('debat') || lower.includes('pidato')) return '🎤';
    return '🏆';
  }
  
  function getBadgeColor(title) {
    if (!title) return '#3b82f6';
    const lower = title.toLowerCase();
    if (lower.includes('juara 1') || lower.includes('juara pertama')) return '#f59e0b'; // Gold
    if (lower.includes('juara 2') || lower.includes('juara kedua')) return '#94a3b8'; // Silver
    if (lower.includes('juara 3') || lower.includes('juara ketiga')) return '#92400e'; // Bronze
    if (lower.includes('akademik')) return '#10b981'; // Green
    if (lower.includes('olahraga')) return '#ef4444'; // Red
    if (lower.includes('seni')) return '#8b5cf6'; // Purple
    return '#3b82f6'; // Blue default
  }
  
  // ============================================
  // MAIN LOADING LOGIC
  // ============================================
  
  try {
    let prestasi = null;
    
    // Coba load dari Firebase dulu
    if (window.firestore) {
      prestasi = await loadFromFirebase();
    }
    
    // Jika Firebase gagal, coba dari Data.js
    if (!prestasi) {
      prestasi = loadFromDataJS();
    }
    
    // Jika masih tidak ada data, tampilkan error
    if (!prestasi) {
      console.error('Tidak bisa load data dari mana pun');
      return;
    }
    
    renderPrestasi(prestasi);
    
    console.log('✅ Prestasi page loaded successfully');
    
  } catch (error) {
    console.error('Error loading prestasi:', error);
    const container = document.getElementById('prestasiTimeline');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#f87171;">
          <p>Error: ${error.message}</p>
        </div>
      `;
    }
  }
});
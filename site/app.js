// Comics App - Interactive Filtering and Modal
let currentFilters = { date: 'all', category: 'all' };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupFilters();
  setupCardClicks();
  setupModalClose();
});

// Setup filter event listeners
function setupFilters() {
  const dateFilter = document.getElementById('date-filter');
  const categoryFilter = document.getElementById('category-filter');
  const resetBtn = document.getElementById('reset-filters');
  
  if (dateFilter) {
    dateFilter.addEventListener('change', (e) => {
      currentFilters.date = e.target.value;
      applyFilters();
    });
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      applyFilters();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
}

// Apply filters to comics
function applyFilters() {
  const cards = document.querySelectorAll('.comic-card');
  const noResults = document.getElementById('no-results');
  const title = document.getElementById('comics-title');
  let visibleCount = 0;
  
  cards.forEach(card => {
    const cardDate = card.getAttribute('data-date');
    const cardCategory = card.getAttribute('data-category');
    
    const dateMatch = currentFilters.date === 'all' || cardDate === currentFilters.date;
    const categoryMatch = currentFilters.category === 'all' || cardCategory === currentFilters.category;
    
    if (dateMatch && categoryMatch) {
      card.style.display = 'block';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Update title
  let titleText = 'All Comics';
  if (currentFilters.date !== 'all' && currentFilters.category !== 'all') {
    titleText = `${currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1)} Comics - ${currentFilters.date}`;
  } else if (currentFilters.date !== 'all') {
    titleText = `Comics for ${currentFilters.date}`;
  } else if (currentFilters.category !== 'all') {
    titleText = `${currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1)} Comics`;
  }
  title.textContent = `${titleText} (${visibleCount})`;
  
  // Show/hide no results message
  if (visibleCount === 0) {
    noResults.style.display = 'block';
    document.getElementById('comics-grid').style.display = 'none';
  } else {
    noResults.style.display = 'none';
    document.getElementById('comics-grid').style.display = 'grid';
  }
}

// Reset filters
function resetFilters() {
  currentFilters = { date: 'all', category: 'all' };
  document.getElementById('date-filter').value = 'all';
  document.getElementById('category-filter').value = 'all';
  applyFilters();
}

// Setup card click handlers
function setupCardClicks() {
  const cards = document.querySelectorAll('.comic-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.getAttribute('data-index'));
      openModal(comicsData[index]);
    });
  });
}

// Open modal with comic details
function openModal(comic) {
  const modal = document.getElementById('comic-modal');
  const modalBody = document.getElementById('modal-body');
  
  modalBody.innerHTML = `
    <div class="modal-header">
      <div class="badges">
        <span class="date-badge">${comic.date}</span>
        <span class="category-badge">${comic.category}</span>
      </div>
    </div>
    
    <div class="modal-image">
      <img src="../images/${comic.date}_${comic.category}_${comic.categoryIndex}.webp" alt="${comic.comic.caption}">
      <div class="caption-large">${comic.comic.caption}</div>
    </div>
    
    <div class="modal-details">
      <h2>${comic.news_title}</h2>
      
      <div class="news-summary">
        <h3>📰 News Summary</h3>
        <p>${comic.news_summary}</p>
      </div>
      
      <div class="explanation">
        <h3>🎨 About This Cartoon</h3>
        <p>${comic.explanation_paragraph}</p>
      </div>
      
      <div class="comic-details">
        <h3>🖼️ Visual Description</h3>
        <p>${comic.comic.panel_description}</p>
      </div>
      
      <div class="safety-info">
        <p><strong>Safety Level:</strong> <span class="risk-${comic.safety_checks.defamation_risk}">${comic.safety_checks.defamation_risk}</span></p>
        <p><strong>Topic:</strong> ${comic.safety_checks.sensitive_topic}</p>
      </div>
      
      <div class="tags">
        ${comic.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      
      <div class="source-link">
        <p><strong>Source:</strong> ${comic.news_source}</p>
        <a href="${comic.news_url}" target="_blank" class="btn-primary">Read Original Article →</a>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
  const modal = document.getElementById('comic-modal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Setup modal close handlers
function setupModalClose() {
  const modal = document.getElementById('comic-modal');
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

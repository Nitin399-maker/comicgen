import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildIndexPage = (allData) => {
  const siteDir = path.join(__dirname, '..', 'site');
  const rootDir = path.join(__dirname, '..');
  const sorted = allData.sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  const allDates = [...new Set(sorted.map(d => d.date))];
  const allCategories = [...new Set(sorted.flatMap(d => d.items.map(i => i.category)))];
  const categoryCounters = {};
  const comicsData = sorted.flatMap(day => {
    const dayCounters = {};
    return day.items.map(item => {
      if (!dayCounters[item.category]) {
        dayCounters[item.category] = 0;
      }
      dayCounters[item.category]++;
      
      return {
        date: day.date,
        category: item.category,
        categoryIndex: dayCounters[item.category],
        ...item
      };
    });
  });
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily News Comics</title>
  <link rel="stylesheet" href="site/style.css">
</head>
<body>
  <header>
    <h1>📰 Daily News Comics</h1>
    <p>Satirical editorial cartoons from today's headlines</p>
  </header>
  
  <nav class="filters">
    <div class="filter-group">
      <label for="date-filter">📅 Select Date:</label>
      <select id="date-filter">
        <option value="all">All Dates</option>
        ${allDates.map(date => `<option value="${date}">${date}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="category-filter">🏷️ Select Category:</label>
      <select id="category-filter">
        <option value="all">All Categories</option>
        ${allCategories.map(cat => `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('')}
      </select>
    </div>
    
    <button id="reset-filters" class="btn-reset">Reset Filters</button>
  </nav>
  
  <main>
    <section class="comics-section">
      <h2 id="comics-title">All Comics (${comicsData.length})</h2>
      <div id="comics-grid" class="comics-grid">
        ${comicsData.map((item, index) => `
          <article class="comic-card" data-date="${item.date}" data-category="${item.category}" data-index="${index}">
            <div class="badges">
              <span class="date-badge">${item.date}</span>
              <span class="category-badge">${item.category}</span>
            </div>
            <img src="images/${item.date}_${item.category}_${item.categoryIndex}.webp" alt="${item.comic.caption}" loading="lazy">
            <div class="caption">${item.comic.caption}</div>
            <h3>${item.news_title.substring(0, 80)}${item.news_title.length > 80 ? '...' : ''}</h3>
            <p class="summary">${item.news_summary.substring(0, 120)}${item.news_summary.length > 120 ? '...' : ''}</p>
            <div class="tags">
              ${item.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          </article>
        `).join('')}
      </div>
      
      <div id="no-results" class="no-results" style="display: none;">
        <p>No comics found for the selected filters.</p>
        <button onclick="resetFilters()">Reset Filters</button>
      </div>
    </section>
  </main>
  
  <!-- Modal for comic details -->
  <div id="comic-modal" class="modal">
    <div class="modal-content">
      <span class="modal-close" onclick="closeModal()">&times;</span>
      <div id="modal-body"></div>
    </div>
  </div>
  
  <footer>
    <p>Generated automatically by Daily News Comic Bot • ${comicsData.length} comics from ${allDates.length} days</p>
  </footer>
  
  <script>
    const comicsData = ${JSON.stringify(comicsData)};
  </script>
  <script src="site/app.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(rootDir, 'index.html'), html);
  console.error('Built index.html (in root directory)');
}

const buildCategoryPages = (allData) => {
  const siteDir = path.join(__dirname, '..', 'site');
  const byCategory = {};
  allData.forEach(day => {
    const dayCounters = {};
    day.items.forEach(item => {
      if (!dayCounters[item.category]) {
        dayCounters[item.category] = 0;
      }
      dayCounters[item.category]++;
      
      if (!byCategory[item.category]) {
        byCategory[item.category] = [];
      }
      byCategory[item.category].push({ 
        ...item, 
        date: day.date,
        categoryIndex: dayCounters[item.category]
      });
    });
  });
  
  // Create page for each category
  Object.keys(byCategory).forEach(category => {
    const items = byCategory[category];
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${category} Comics Archive</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>📰 ${category} Comics</h1>
    <p><a href="index.html">← Back to home</a></p>
  </header>
  
  <main>
    <div class="comics-grid">
      ${items.map(item => `
        <article class="comic-card">
          <div class="date-badge">${item.date}</div>
          <img src="../images/${item.date}_${item.category}_${item.categoryIndex}.webp" alt="${item.comic.caption}">
          <div class="caption">${item.comic.caption}</div>
          <h3>${item.news_title}</h3>
          <p class="summary">${item.news_summary}</p>
        </article>
      `).join('')}
    </div>
  </main>
</body>
</html>`;
    
    fs.writeFileSync(path.join(siteDir, `category_${category}.html`), html);
    console.error(`Built category_${category}.html`);
  });
}

const buildDayTemplate = () => {
  const siteDir = path.join(__dirname, '..', 'site');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Comics</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>📰 Daily News Comics</h1>
    <p><a href="index.html">← Back to home</a></p>
  </header>
  
  <main id="day-content">
    <!-- Populated by app.js -->
  </main>
  
  <script src="app.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(siteDir, 'day.html'), html);
  console.error('Built day.html template');
}

const buildAppJS = () => {
  const siteDir = path.join(__dirname, '..', 'site');
  
  const js = `// Comics App - Interactive Filtering and Modal
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
    titleText = \`\${currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1)} Comics - \${currentFilters.date}\`;
  } else if (currentFilters.date !== 'all') {
    titleText = \`Comics for \${currentFilters.date}\`;
  } else if (currentFilters.category !== 'all') {
    titleText = \`\${currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1)} Comics\`;
  }
  title.textContent = \`\${titleText} (\${visibleCount})\`;
  
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
  
  modalBody.innerHTML = \`
    <div class="modal-header">
      <div class="badges">
        <span class="date-badge">\${comic.date}</span>
        <span class="category-badge">\${comic.category}</span>
      </div>
    </div>
    
    <div class="modal-image">
      <img src="../images/\${comic.date}_\${comic.category}_\${comic.categoryIndex}.webp" alt="\${comic.comic.caption}">
      <div class="caption-large">\${comic.comic.caption}</div>
    </div>
    
    <div class="modal-details">
      <h2>\${comic.news_title}</h2>
      
      <div class="news-summary">
        <h3>📰 News Summary</h3>
        <p>\${comic.news_summary}</p>
      </div>
      
      <div class="explanation">
        <h3>🎨 About This Cartoon</h3>
        <p>\${comic.explanation_paragraph}</p>
      </div>
      
      <div class="comic-details">
        <h3>🖼️ Visual Description</h3>
        <p>\${comic.comic.panel_description}</p>
      </div>
      
      <div class="safety-info">
        <p><strong>Safety Level:</strong> <span class="risk-\${comic.safety_checks.defamation_risk}">\${comic.safety_checks.defamation_risk}</span></p>
        <p><strong>Topic:</strong> \${comic.safety_checks.sensitive_topic}</p>
      </div>
      
      <div class="tags">
        \${comic.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
      </div>
      
      <div class="source-link">
        <p><strong>Source:</strong> \${comic.news_source}</p>
        <a href="\${comic.news_url}" target="_blank" class="btn-primary">Read Original Article →</a>
      </div>
    </div>
  \`;
  
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
`;
  
  fs.writeFileSync(path.join(siteDir, 'app.js'), js);
  console.error('Built app.js');
}

const buildCSS = () => {
  const siteDir = path.join(__dirname, '..', 'site');
  
  const css = `/* Daily News Comics Styles - Enhanced */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --accent-color: #e74c3c;
  --bg-color: #f5f5f5;
  --card-bg: #ffffff;
  --text-color: #333;
  --light-text: #777;
  --border-color: #ecf0f1;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background: var(--bg-color);
}

header {
  background: linear-gradient(135deg, var(--primary-color) 0%, #34495e 100%);
  color: white;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Filters Navigation */
.filters {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--primary-color);
}

.filter-group select {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-group select:hover {
  border-color: var(--secondary-color);
}

.filter-group select:focus {
  outline: none;
  border-color: var(--secondary-color);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-reset {
  padding: 0.75rem 1.5rem;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-end;
}

.btn-reset:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

main {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.comics-section h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.comics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  margin: 2rem 0;
}

.comic-card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
}

.comic-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.comic-card .badges {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 1rem 0;
}

.category-badge, .date-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.date-badge {
  background: #95a5a6;
  color: white;
}

.category-badge {
  background: var(--secondary-color);
  color: white;
}

.comic-card img {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 0;
}

.caption {
  font-style: italic;
  font-weight: 600;
  color: var(--primary-color);
  margin: 1rem 1rem 0.5rem;
  padding: 0.75rem;
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  font-size: 0.95rem;
}

.comic-card h3 {
  font-size: 1.05rem;
  margin: 0 1rem 0.75rem;
  color: var(--primary-color);
  line-height: 1.4;
}

.summary {
  font-size: 0.9rem;
  color: var(--light-text);
  margin: 0 1rem 1rem;
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 0 1rem 1rem;
}

.tag {
  background: var(--border-color);
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  color: #555;
  font-weight: 500;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.no-results p {
  font-size: 1.2rem;
  color: var(--light-text);
  margin-bottom: 1.5rem;
}

.no-results button {
  padding: 0.75rem 2rem;
  background: var(--secondary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.no-results button:hover {
  background: #2980b9;
}

/* Modal Styles */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  overflow-y: auto;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-close {
  position: sticky;
  top: 0;
  right: 0;
  float: right;
  font-size: 2rem;
  font-weight: bold;
  color: #aaa;
  cursor: pointer;
  padding: 1rem;
  z-index: 10;
  background: var(--card-bg);
}

.modal-close:hover {
  color: #000;
}

.modal-header .badges {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-image {
  text-align: center;
  background: #f8f9fa;
  padding: 2rem;
}

.modal-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.caption-large {
  font-style: italic;
  font-weight: 700;
  font-size: 1.3rem;
  color: var(--primary-color);
  margin-top: 1.5rem;
  padding: 1rem 2rem;
  background: #fff3cd;
  border-left: 6px solid #ffc107;
  border-radius: 6px;
  text-align: left;
}

.modal-details {
  padding: 2rem;
}

.modal-details h2 {
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
  line-height: 1.3;
}

.modal-details h3 {
  color: var(--primary-color);
  margin: 1.5rem 0 0.75rem;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.news-summary, .explanation, .comic-details, .safety-info {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.safety-info p {
  margin: 0.5rem 0;
}

.risk-low {
  color: #27ae60;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-medium {
  color: #f39c12;
  font-weight: 600;
  text-transform: uppercase;
}

.risk-high {
  color: #e74c3c;
  font-weight: 600;
  text-transform: uppercase;
}

.source-link {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 2px solid var(--border-color);
}

.btn-primary {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: var(--secondary-color);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-primary:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

footer {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--light-text);
  font-size: 0.9rem;
  background: var(--card-bg);
  margin-top: 4rem;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  header h1 {
    font-size: 1.8rem;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    min-width: 100%;
  }
  
  .btn-reset {
    align-self: stretch;
  }
  
  .comics-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .modal {
    padding: 1rem;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .caption-large {
    font-size: 1.1rem;
    padding: 0.75rem 1rem;
  }
  
  .modal-details {
    padding: 1rem;
  }
}
`;
  
  fs.writeFileSync(path.join(siteDir, 'style.css'), css);
  console.error('Built style.css');
}

const main = () => {
  const dataDir = path.join(__dirname, '..', 'data');
  const siteDir = path.join(__dirname, '..', 'site');

  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }

  const allData = [];
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      const buffer = fs.readFileSync(path.join(dataDir, file));
      let content;
      
      // Handle different BOMs
      if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        // UTF-16 LE BOM
        content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
      } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        // UTF-8 BOM
        content = buffer.toString('utf8').replace(/^\uFEFF/, '');
      } else {
        // No BOM or unknown encoding
        content = buffer.toString('utf8').replace(/^\uFEFF/, '');
      }
      
      const data = JSON.parse(content);
      allData.push(data);
    });
  }
  
  console.error(`Building site from ${allData.length} days of data...`);
  
  // Build all pages
  buildIndexPage(allData);
  buildCategoryPages(allData);
  buildDayTemplate();
  buildAppJS();
  buildCSS();
  
  console.error('Site build complete!');
}

// Run main function
main();

export { buildIndexPage, buildCategoryPages, buildDayTemplate, buildAppJS, buildCSS };

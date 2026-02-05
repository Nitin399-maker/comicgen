# Daily News Comic Bot

Automated system for generating satirical editorial comics from daily news.

## Overview

The Daily News Comic Bot is a fully automated pipeline that:
1. Fetches top news from RSS feeds (Technology, Politics, Business, Sports)
2. Scrapes full article content for better context
3. Generates satirical comic specifications using AI (Claude Sonnet)
4. Creates compressed WebP images using AI (Gemini)
5. Builds and deploys a static website daily via GitHub Actions

## Key Features

- ✅ **Fully Automated** - Runs daily via GitHub Actions, no manual intervention
- ✅ **AI-Powered** - Uses Claude for creative comic specs, Gemini for image generation
- ✅ **Compressed WebP** - Images optimized for web (80% quality, ~60-80KB each)
- ✅ **Multi-Category** - Technology, Politics, Business, Sports
- ✅ **Content Safety** - Built-in defamation and sensitivity checks
- ✅ **Indian Style** - RK Laxman/Amul aesthetic editorial cartoons
- ✅ **Static Site** - Fast, SEO-friendly website with responsive design

## Quick Start

```bash
# Install dependencies
npm install

# Set API key
export OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE

# Generate today's comics
npm run unified

# Generate images
npm run images

# Build website
npm run build
```

For complete GitHub Actions setup, see [GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)

## Architecture

```
comicgen/
├── data/                    # Daily JSON outputs
│   ├── 2026-01-28.json
│   ├── 2026-01-29.json
│   └── ...
├── images/                  # Generated comic images
│   ├── 2026-01-28_technology.webp
│   └── ...
├── site/                    # Static website assets
│   ├── category.html       # Category archives
│   ├── day.html            # Daily view
│   ├── app.js              # Frontend logic
│   └── style.css           # Styles
├── index.html              # Homepage (root level)
├── scripts/                 # Pipeline scripts
│   ├── unified_comic_generator.js  # Fetch news + generate specs
│   ├── generate_comics.js          # WebP image generation
│   └── build_site.js               # Site builder
├── .github/workflows/       # GitHub Actions
│   └── daily.yml           # Daily automation
└── README.md
```

## Usage

### Local Development

```bash
# Generate comics for today
npm run unified

# Generate for specific date
node scripts/unified_comic_generator.js 2026-02-05

# Generate images
npm run images 2026-02-05

# Build website
npm run build

# Full pipeline
npm run unified && npm run images && npm run build
```

### Environment Variables

```bash
# Required for comic generation and image generation
OPENROUTER_API_KEY=sk-or-v1-YOUR-KEY-HERE

# Optional overrides
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_BASE_URL=https://llmfoundry.straivedemo.com/openrouter/v1
```

### Output Format

```json
{
  "date": "2026-02-03",
  "items": [
    {
      "category": "technology",
      "news_title": "...",
      "news_url": "...",
      "news_source": "...",
      "news_summary": "...",
      "comic": {
        "panel_description": "...",
        "caption": "...",
        "image_prompt": "...",
        "negative_prompt": "...",
        "layout_notes": "..."
      },
      "explanation_paragraph": "...",
      "safety_checks": {
        "defamation_risk": "low",
        "sensitive_topic": "none",
        "notes": "..."
      },
      "tags": ["tag1", "tag2", "..."]
    }
  ]
}
```

## Selection Rules

1. **One article per category** - No duplicates across categories
2. **Prefer satirical potential** - Irony, contradiction, exaggeration, absurdity
3. **Avoid risky content** - Technical jargon, legal accusations, defamation risks
4. **Safety first** - Skip unsafe stories, pick next best alternative

## Safety Guidelines

### NEVER
- Depict or name real people
- Use hate speech, slurs, or harassment
- Target individuals (only critique systems)
- Include logos or brand mascots

### ALWAYS
- Use generic roles ("a minister", "a CEO", "a commuter")
- Keep satire focused on systems and patterns
- Ensure high defamation safety
- Maintain editorial cartoon style

## Image Style Requirements

All image prompts must specify:
- Single-panel newspaper editorial cartoon
- RK Laxman style (simple, expressive line art)
- Amul advertisement aesthetic (minimal color, bold characters)
- Simple background, high readability
- Clear whitespace for caption
- Classic Indian editorial cartoon style
- NO named individuals, NO brand mascots

## Pipeline Integration

### 1. Unified Comic Generator (scripts/unified_comic_generator.js)
```javascript
// Single script that:
// - Fetches RSS feeds from multiple sources
// - Scrapes full article content
// - Generates comic specs using Claude Sonnet
// - Saves to data/YYYY-MM-DD.json
```

### 2. Image Generation (scripts/generate_comics.js)
```javascript
// Reads comic specs from data/YYYY-MM-DD.json
// Generates images using Gemini via OpenRouter
// Converts to WebP with compression (quality: 80, effort: 6)
// Style: RK Laxman / Amul advertisement aesthetic
// Saves to images/YYYY-MM-DD_category_N.webp
```

### 3. Site Building (scripts/build_site.js)
```javascript
// Builds static site from data/ and images/
// Generates index.html, category pages, daily pages
// Serves WebP images for fast loading
```

## GitHub Actions Workflow

The pipeline runs automatically every day at 6 AM UTC (11:30 AM IST).

```yaml
# .github/workflows/daily.yml
name: Daily Comic Generation
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:      # Manual trigger option

jobs:
  generate-comics:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate comic specifications
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: node scripts/unified_comic_generator.js "$TARGET_DATE"
      
      - name: Generate comic images (WebP)
        env:
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
        run: node scripts/generate_comics.js "$TARGET_DATE"
      
      - name: Build static site
        run: node scripts/build_site.js
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./site
```

## Testing

```bash
# Test unified generator
node scripts/unified_comic_generator.js 2026-02-05

# Test image generation
node scripts/generate_comics.js 2026-02-05

# Test site building
node scripts/build_site.js

# Validate JSON output
cat data/2026-02-05.json | jq '.items | length'

# Check safety
cat data/2026-02-05.json | jq '.items[].safety_checks'

# View generated images
ls images/*.webp
```

## Extensibility

### Adding New Categories

Edit `scripts/unified_comic_generator.js`:
```javascript
const CONFIG = {
  categories: [
    // ... existing categories
    {
      name: 'Environment',
      slug: 'environment',
      sources: ['downtoearth', 'mongabay'],
      rss_feeds: [
        'https://www.downtoearth.org.in/rss',
        'https://india.mongabay.com/feed/'
      ]
    }
  ],
  articlesPerCategory: 3
};
```

### Adjusting Image Quality

Edit `scripts/generate_comics.js`:
```javascript
await sharp(imageBuffer)
  .webp({ 
    quality: 80,   // 0-100 (higher = better, larger)
    effort: 6,     // 0-6 (higher = better compression)
    lossless: false
  })
  .toFile(outputPath);
```

### Changing AI Models

In GitHub Secrets or environment variables:
```bash
# For comic specifications (default: Claude 3.5 Sonnet)
OPENROUTER_MODEL=anthropic/claude-3-opus

# For image generation (default: Gemini Pro Vision)
# Edit scripts/generate_comics.js line 19
```

## Documentation

- **[README.md](README.md)** - This file, project overview
- **[GITHUB_ACTIONS_SETUP.md](GITHUB_ACTIONS_SETUP.md)** - Complete automation setup guide
- **[UNIFIED_GENERATOR_GUIDE.md](UNIFIED_GENERATOR_GUIDE.md)** - Unified generator details
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Local testing instructions

## Technologies

- **Node.js 18+** - Runtime environment
- **JavaScript (ES Modules)** - All scripts
- **Sharp** - WebP image processing and compression
- **Cheerio** - Web scraping
- **RSS Parser** - Feed parsing
- **OpenRouter API** - AI model access (Claude + Gemini)
- **GitHub Actions** - CI/CD automation
- **GitHub Pages** - Static site hosting

## Cost Estimates

Running this bot costs approximately:
- **Per Day**: $0.01 - $0.05 USD
- **Per Month**: $0.30 - $1.50 USD
- **Per Year**: $3.60 - $18.00 USD

Costs breakdown:
- Comic spec generation (Claude): ~$0.005 per comic × 12 comics = $0.06/day
- Image generation (Gemini): ~$0.01 per image × 4 images = $0.04/day (if available)
- Total: ~$0.01-0.05/day depending on usage

## Project Status

- ✅ **Production Ready** - Fully functional and tested
- ✅ **Automated** - Daily workflow via GitHub Actions
- ✅ **WebP Optimized** - Compressed images for fast loading
- ✅ **Well Documented** - Complete guides and troubleshooting
- 🔄 **Active Development** - Regular updates and improvements

## License

MIT License - See LICENSE file

## Contributing

Contributions welcome! Feel free to:
- Report bugs via GitHub Issues
- Suggest new features
- Submit pull requests
- Improve documentation

## Contact

For issues or questions, open a GitHub issue.

---

**Last Updated:** February 5, 2026  
**Version:** 2.0.0 (Unified JavaScript Architecture)  
**Status:** Production Ready ✅

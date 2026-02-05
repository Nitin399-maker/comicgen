# Daily News Comic Bot

Automated system for generating satirical editorial comics from daily news.

## Overview

The Daily News Comic Bot is a fully automated pipeline that:
1. Selects newsworthy articles based on satirical potential
2. Generates safe, generic comic specifications
3. Produces structured JSON for image generation
4. Powers a daily publishing pipeline and archive website

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
├── site/                    # Static website
│   ├── index.html          # Homepage
│   ├── category.html       # Category archives
│   ├── day.html            # Daily view
│   └── app.js              # Frontend logic
├── scripts/                 # Pipeline scripts
│   ├── fetch_news.js       # News fetching
│   ├── generate_comics.js  # Image generation
│   └── build_site.js       # Site builder
├── .github/workflows/       # GitHub Actions
│   └── daily.yml           # Daily automation
├── comic_bot.py            # Main bot (THIS FILE)
└── README.md
```

## Usage

### Daily Run

```bash
# Prepare input JSON with fetched articles
cat input.json | python comic_bot.py > data/2026-02-03.json
```

### Input Format

```json
{
  "run_mode": "daily",
  "target_date": "2026-02-03",
  "categories_config": [
    {
      "name": "Technology",
      "slug": "technology",
      "sources": ["techcrunch", "theverge"]
    }
  ],
  "fetched_articles": [
    {
      "category_slug": "technology",
      "title": "Article Title",
      "url": "https://...",
      "source": "Source Name",
      "published_at": "2026-02-03T08:00:00Z",
      "excerpt": "Article summary..."
    }
  ]
}
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

### 1. News Fetching (scripts/fetch_news.js)
```javascript
// Fetch articles from configured sources
// Output: fetched_articles array
```

### 2. Comic Generation (comic_bot.py)
```bash
# Select articles and generate comic specs
cat input.json | python comic_bot.py > data/YYYY-MM-DD.json
```

### 3. Image Generation (scripts/generate_comics.js)
```javascript
// Read comic specs from data/YYYY-MM-DD.json
// Generate images using OpenRouter (Gemini Nano)
// Style: RK Laxman / Amul advertisement aesthetic
// Save to images/YYYY-MM-DD_category.webp
```

### 4. Site Building (scripts/build_site.js)
```javascript
// Build static site from data/ and images/
// Generate index, category pages, daily pages
```

## GitHub Actions Workflow

```yaml
# .github/workflows/daily.yml
name: Daily Comic Generation
on:
  schedule:
    - cron: '0 6 * * *'  # 6 AM UTC daily
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Fetch News
        run: node scripts/fetch_news.js
      - name: Generate Comics
        run: cat input.json | python comic_bot.py > data/$(date +%Y-%m-%d).json
      - name: Create Images
        run: node scripts/generate_comics.js
      - name: Build Site
        run: node scripts/build_site.js
      - name: Deploy
        run: # Deploy to GitHub Pages or hosting
```

## Testing

```bash
# Test with example input
cat example_input.json | python comic_bot.py

# Validate output
python -m json.tool output.json

# Check safety
grep -i "defamation_risk" output.json
```

## Extensibility

### Adding New Categories

Edit `categories_config`:
```json
{
  "name": "Environment",
  "slug": "environment",
  "sources": ["downtoearth", "mongabay"],
  "selection_rules": {
    "prefer_irony": true
  }
}
```

### Adding New Segments

The bot supports future extensions:
- Multi-panel comics (update `comic` schema)
- Video segments (add `video` field)
- Audio commentary (add `audio` field)

## License

MIT License - See LICENSE file

## Contact

For issues or questions, open a GitHub issue.

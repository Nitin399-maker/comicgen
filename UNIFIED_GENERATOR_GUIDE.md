# Unified Comic Generator Guide

## Overview

The `unified_comic_generator.js` script combines all functionality into a single JavaScript file:
- ✅ Fetches top 3 latest news from each category (Technology, Politics, Business, Sports)
- ✅ Visits each article URL and scrapes the full content
- ✅ Combines RSS excerpt with scraped article context
- ✅ Generates satirical editorial cartoon specifications using LLM
- ✅ Saves output to `data/YYYY-MM-DD.json`

## Features

### 1. RSS Feed Parsing
- Fetches latest articles from configured RSS feeds
- Supports multiple feeds per category
- Gets top 3 articles per category

### 2. Web Scraping
- Visits each article URL
- Extracts full article content using multiple selector strategies
- Removes ads, scripts, navigation elements
- Combines RSS excerpt with scraped content for better context

### 3. LLM Comic Generation
- Uses OpenRouter API (Claude Sonnet 3.5 by default)
- Generates complete comic specifications:
  - News summary
  - Panel description
  - Caption
  - Image prompt (Stable Diffusion ready)
  - Safety checks
  - Tags

### 4. Automatic Storage
- Saves to `data/YYYY-MM-DD.json`
- Also outputs to stdout for piping

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Dependencies** (already installed):
   ```bash
   npm install
   ```
3. **Environment Variable**:
   ```bash
   set OPENROUTER_API_KEY=your-api-key-here
   ```

## Usage

### Basic Usage (Today's Date)
```bash
npm run unified
```

### Specify a Date
```bash
node scripts/unified_comic_generator.js 2026-02-05
```

### Using the NPM Script
```bash
npm run unified 2026-02-05
```

### Full Daily Pipeline (Unified + Build Site)
```bash
npm run daily-unified
```

## Output Format

The script generates a JSON file with this structure:

```json
{
  "date": "2026-02-04",
  "items": [
    {
      "category": "technology",
      "news_title": "Article Title",
      "news_url": "https://...",
      "news_source": "TechCrunch",
      "news_summary": "2-4 line summary",
      "comic": {
        "panel_description": "Scene description",
        "caption": "Witty caption",
        "image_prompt": "Stable Diffusion prompt",
        "negative_prompt": "Things to avoid",
        "layout_notes": "Composition notes"
      },
      "explanation_paragraph": "How cartoon satirizes the news",
      "safety_checks": {
        "defamation_risk": "low",
        "sensitive_topic": "none",
        "notes": "Safety assessment"
      },
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}
```

## Configuration

Edit `CONFIG` in [unified_comic_generator.js](scripts/unified_comic_generator.js):

```javascript
const CONFIG = {
  categories: [...],           // Category configurations
  articlesPerCategory: 3,      // Number of articles per category
  apiUrl: '...',              // LLM API endpoint
  model: '...',               // LLM model
  apiKey: process.env.OPENROUTER_API_KEY
};
```

## How It Works

### Step 1: Fetch RSS Feeds
For each category (Technology, Politics, Business, Sports):
- Parses RSS feeds
- Collects article metadata (title, URL, excerpt)

### Step 2: Scrape Full Content
For each article:
- Visits the URL
- Extracts full article text using cheerio
- Cleans and formats content
- Combines with RSS excerpt

### Step 3: Generate Comic Specs
For each article with full context:
- Sends article content to LLM
- LLM generates satirical cartoon specification
- Validates JSON response

### Step 4: Save Results
- Combines all comic specs
- Saves to `data/YYYY-MM-DD.json`
- Outputs to stdout

## Progress Output

The script provides detailed progress information:
```
==================================================
Unified Comic Generator - 2026-02-04
==================================================

[==================================================]
CATEGORY: TECHNOLOGY
[==================================================]

Fetching articles for Technology...
  Parsing feed: https://techcrunch.com/feed/
  Scraping content from: https://...
  ✓ Added article: Article Title...
  
  Generating comic for: Article Title...
  ✓ Comic spec generated successfully

...

==================================================
✓ SUCCESS!
  Generated 12 comic specifications
  Saved to: data/2026-02-04.json
==================================================
```

## Advantages Over Previous Approach

### Old Approach (2 separate scripts)
1. `fetch_news.js` → Fetch RSS only
2. Pipe to `comic_bot.py` → Generate comics
3. Limited context (RSS excerpt only)
4. Requires Python + Node.js

### New Unified Approach
1. ✅ Single JavaScript file
2. ✅ Full article content scraping
3. ✅ Better context for LLM
4. ✅ More accurate comic generation
5. ✅ Simpler execution
6. ✅ Only Node.js required

## Troubleshooting

### API Key Not Set
```
Error: OPENROUTER_API_KEY environment variable not set
```
**Solution**: Set the environment variable:
```bash
set OPENROUTER_API_KEY=your-key
```

### Scraping Failures
Some articles may fail to scrape due to:
- Paywalls
- JavaScript-rendered content
- Anti-bot measures

The script will:
- Fall back to RSS excerpt
- Continue with other articles
- Log errors without crashing

### LLM API Errors
If LLM API fails:
- Check API key validity
- Verify API endpoint is accessible
- Check rate limits

## Examples

### Generate for Today
```bash
npm run unified
```

### Generate for Specific Date
```bash
node scripts/unified_comic_generator.js 2026-02-10
```

### Save to Custom Location
```bash
node scripts/unified_comic_generator.js 2026-02-10 > output.json
```

## Next Steps

After generating comics:
1. Review generated specifications in `data/YYYY-MM-DD.json`
2. Generate actual images: `npm run images`
3. Build the website: `npm run build`
4. Or do both: `npm run daily-unified`

## Notes

- Script adds 500ms delay between scraping requests to be respectful
- Script adds 1s delay between LLM calls to avoid rate limits
- Full article context significantly improves comic quality
- All errors are logged but don't stop execution
- Works with the existing site builder and image generator

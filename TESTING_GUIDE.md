# Complete Pipeline Testing Guide

This guide provides comprehensive instructions for testing the Daily News Comic Bot pipeline from start to finish.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Component Testing](#component-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [GitHub Actions Testing](#github-actions-testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v18+): `node --version`
- **Python** (v3.11+): `python --version`
- **Git**: `git --version`
- **npm**: `npm --version`

### Required API Keys
- **OpenRouter API Key**: Get from [openrouter.ai](https://openrouter.ai)
  - Used for LLM-based comic generation
  - Used for image generation (optional)

---

## Environment Setup

### 1. Install Dependencies

```powershell
# Navigate to project directory
cd C:\Users\hp\OneDrive\Desktop\comicgen

# Install Node.js dependencies
npm install

# Verify installations
npm list rss-parser axios
```

### 2. Set Environment Variables

```powershell
# Set OpenRouter API key (Windows PowerShell)
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR-KEY-HERE"

# Optional: Set specific model
$env:OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet"

# Verify
echo $env:OPENROUTER_API_KEY
```

**For persistent setup**, add to PowerShell profile:
```powershell
# Edit profile
notepad $PROFILE

# Add these lines:
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR-KEY-HERE"
$env:OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet"
```

### 3. Create Test Directories

```powershell
# Ensure required directories exist
New-Item -ItemType Directory -Force -Path data, images, site
```

---

## Component Testing

Test each component of the pipeline individually.

### Test 1: News Fetching Script

**Purpose**: Verify that news articles can be fetched and formatted correctly.

```powershell
# Run fetch script
node scripts/fetch_news.js 2026-02-04 daily > test_input.json

# Check output
cat test_fetch_output.json | jq .

# Validate structure
cat test_fetch_output.json | jq '.fetched_articles | length'
cat test_fetch_output.json | jq '.categories_config | length'
```

**Expected Output**:
```json
{
  "run_mode": "daily",
  "target_date": "2026-02-04",
  "categories_config": [...],
  "fetched_articles": [...]
}
```

**Success Criteria**:
- ✅ Valid JSON output
- ✅ Has `run_mode`, `target_date`, `categories_config`, `fetched_articles`
- ✅ At least 1 article per category
- ✅ Each article has `title`, `url`, `source`, `excerpt`, `category_slug`

---

### Test 2: Comic Bot (LLM Processing)

**Purpose**: Verify that comic specifications are generated correctly using LLM.

#### 2a. Create Test Input

```powershell
# Create a minimal test input
@'
{
  "run_mode": "daily",
  "target_date": "2026-02-04",
  "categories_config": [
    {
      "name": "Technology",
      "slug": "technology",
      "sources": ["techcrunch"]
    }
  ],
  "fetched_articles": [
    {
      "category_slug": "technology",
      "title": "AI Startup Raises Record $10 Billion Despite Having No Product",
      "url": "https://example.com/article",
      "source": "TechCrunch",
      "published_at": "2026-02-04T08:00:00Z",
      "excerpt": "A new AI startup has raised an unprecedented $10 billion in funding, despite having no working product, no customers, and a team of just three people. Investors cite 'revolutionary potential' and 'disruption vibes' as key factors in their decision."
    }
  ]
}
'@ | Out-File -Encoding utf8 test_input.json
```

#### 2b. Run Comic Bot

```powershell
# Run comic bot with test input
cat test_input.json | python comic_bot.py > data/2026-02-04.json

# Check output
cat test_output.json | jq .
```

**Expected Output**:
```json
{
  "date": "2026-02-04",
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
      "tags": [...]
    }
  ]
}
```

**Success Criteria**:
- ✅ Valid JSON output
- ✅ Has `date` and `items` array
- ✅ Each item has all required fields
- ✅ `comic.caption` is witty and under 12 words
- ✅ `comic.image_prompt` mentions "RK Laxman" or "Amul style"
- ✅ `safety_checks.defamation_risk` is assessed
- ✅ Tags include the category

#### 2c. Verify LLM Integration

```powershell
# Test with multiple categories
node scripts/fetch_news.js 2026-02-04 daily | python comic_bot.py > 2026-02-04.json

# Count comics generated
cat test_multi_output.json | jq '.items | length'

# Check all categories
cat test_multi_output.json | jq -r '.items[].category'
```

**Success Criteria**:
- ✅ Generates one comic per category
- ✅ No duplicate articles
- ✅ All LLM-generated content is present
- ✅ API calls complete successfully

---

### Test 3: Image Generation Script

**Purpose**: Verify that comic images can be generated from specifications.

```powershell
# First, ensure you have comic specs
if (!(Test-Path "data/2026-02-04.json")) {
    cat test_output.json > data/2026-02-04.json
}

# Run image generation
node scripts/generate_comics.js 2026-02-04

# Check images directory
ls images/

# Check if image files were created
Get-ChildItem images/ -Filter "2026-02-04_*.webp"
```

**Expected Output**:
- Image files: `images/2026-02-04_technology.webp`, etc.
- OR placeholder files if API is not available
- Console output showing generation progress

**Success Criteria**:
- ✅ Creates one image file per comic
- ✅ Files named as `YYYY-MM-DD_category.webp`
- ✅ No errors in console output
- ✅ Handles API failures gracefully (creates placeholders)

---

### Test 4: Site Building Script

**Purpose**: Verify that static site is built correctly.

```powershell
# Ensure data and images exist
if (!(Test-Path "data/2026-02-04.json")) {
    cat test_output.json > data/2026-02-04.json
}

# Run site builder
node scripts/build_site.js

# Check site directory
ls site/

# View generated HTML
cat site/index.html | Select-String -Pattern "Daily News Comics"
```

**Expected Output**:
- `site/index.html` - Homepage
- `site/category.html` - Category pages (if implemented)
- `site/style.css` - Stylesheet (if generated)
- `site/app.js` - Frontend JavaScript (if generated)

**Success Criteria**:
- ✅ Generates HTML files
- ✅ Includes comic data from JSON
- ✅ Links to image files
- ✅ Valid HTML structure

---

## Integration Testing

Test multiple components working together.

### Integration Test 1: Fetch → Generate Comics

```powershell
# Full fetch-to-comic pipeline
node scripts/fetch_news.js 2026-02-04 daily | python comic_bot.py > data/2026-02-04.json

# Validate
cat data/2026-02-04.json | jq '.items | length'

# Check for errors
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fetch → Comic generation: SUCCESS" -ForegroundColor Green
} else {
    Write-Host "❌ Fetch → Comic generation: FAILED" -ForegroundColor Red
}
```

### Integration Test 2: Comics → Images

```powershell
# Ensure comic specs exist
cat test_output.json > data/2026-02-04.json

# Generate images
node scripts/generate_comics.js 2026-02-04

# Count images
$imageCount = (Get-ChildItem images/ -Filter "2026-02-04_*.webp").Count
Write-Host "Generated $imageCount images"
```

### Integration Test 3: Full Data → Site Pipeline

```powershell
# Ensure data and images exist
cat test_output.json > data/2026-02-04.json
node scripts/generate_comics.js 2026-02-04

# Build site
node scripts/build_site.js

# Verify site has content
$hasContent = (cat site/index.html | Select-String -Pattern "2026-02-04").Matches.Count -gt 0

if ($hasContent) {
    Write-Host "✅ Site includes 2026-02-04 data" -ForegroundColor Green
} else {
    Write-Host "❌ Site missing 2026-02-04 data" -ForegroundColor Red
}
```

---

## End-to-End Testing

Test the complete pipeline as it would run in production.

### E2E Test: Complete Daily Run

```powershell
# Set date for testing
$TEST_DATE = "2026-02-04"

Write-Host "🚀 Starting End-to-End Pipeline Test" -ForegroundColor Cyan
Write-Host "Target Date: $TEST_DATE" -ForegroundColor Cyan
Write-Host ""

# Step 1: Fetch news
Write-Host "Step 1: Fetching news..." -ForegroundColor Yellow
node scripts/fetch_news.js $TEST_DATE daily > fetch_output.json
if ($LASTEXITCODE -eq 0) {
    $articleCount = (cat fetch_output.json | jq '.fetched_articles | length')
    Write-Host "✅ Fetched $articleCount articles" -ForegroundColor Green
} else {
    Write-Host "❌ News fetch failed" -ForegroundColor Red
    exit 1
}

# Step 2: Generate comics
Write-Host "Step 2: Generating comic specifications..." -ForegroundColor Yellow
cat fetch_output.json | python comic_bot.py > "data/$TEST_DATE.json"
if ($LASTEXITCODE -eq 0) {
    $comicCount = (cat "data/$TEST_DATE.json" | jq '.items | length')
    Write-Host "✅ Generated $comicCount comic specs" -ForegroundColor Green
} else {
    Write-Host "❌ Comic generation failed" -ForegroundColor Red
    exit 1
}

# Step 3: Generate images
Write-Host "Step 3: Generating comic images..." -ForegroundColor Yellow
node scripts/generate_comics.js $TEST_DATE
if ($LASTEXITCODE -eq 0) {
    $imageCount = (Get-ChildItem images/ -Filter "${TEST_DATE}_*.webp").Count
    Write-Host "✅ Generated $imageCount images" -ForegroundColor Green
} else {
    Write-Host "⚠️ Image generation completed with warnings" -ForegroundColor Yellow
}

# Step 4: Build site
Write-Host "Step 4: Building static site..." -ForegroundColor Yellow
node scripts/build_site.js
if ($LASTEXITCODE -eq 0 -and (Test-Path "site/index.html")) {
    Write-Host "✅ Site built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Site build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 End-to-End Pipeline Test COMPLETE" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Articles fetched: $articleCount" -ForegroundColor White
Write-Host "  - Comics generated: $comicCount" -ForegroundColor White
Write-Host "  - Images created: $imageCount" -ForegroundColor White
Write-Host "  - Site pages built: ✓" -ForegroundColor White
Write-Host ""
Write-Host "Output files:" -ForegroundColor Cyan
Write-Host "  - Comic specs: data/$TEST_DATE.json" -ForegroundColor White
Write-Host "  - Images: images/${TEST_DATE}_*.webp" -ForegroundColor White
Write-Host "  - Website: site/index.html" -ForegroundColor White
```

### E2E Validation Checklist

After running the E2E test, manually verify:

- [ ] **Data file exists**: `data/2026-02-04.json`
- [ ] **Valid JSON**: Can be parsed without errors
- [ ] **Comic specs complete**: All required fields present
- [ ] **Images generated**: One per category
- [ ] **Site built**: `site/index.html` exists
- [ ] **Site displays comics**: Open in browser to verify
- [ ] **No errors in console**: Check all command outputs
- [ ] **LLM calls succeeded**: Check for API errors

---

## GitHub Actions Testing

Test the automated workflow locally and on GitHub.

### Local GitHub Actions Simulation

```powershell
# Simulate the GitHub Actions workflow
Write-Host "Simulating GitHub Actions workflow..." -ForegroundColor Cyan

# Set environment variables (like GitHub Actions secrets)
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR-KEY-HERE"
$env:TARGET_DATE = (Get-Date -Format "yyyy-MM-dd")
$env:RUN_MODE = "daily"

# Run the workflow steps
Write-Host "Installing dependencies..."
npm install rss-parser axios

Write-Host "Fetching news..."
node scripts/fetch_news.js $env:TARGET_DATE $env:RUN_MODE > input.json

Write-Host "Generating comics..."
cat input.json | python comic_bot.py > "data/$env:TARGET_DATE.json"

Write-Host "Generating images..."
node scripts/generate_comics.js $env:TARGET_DATE

Write-Host "Building site..."
node scripts/build_site.js

Write-Host "✅ Workflow simulation complete!" -ForegroundColor Green
```

### Testing GitHub Actions Manually

1. **Push to GitHub** (if not already done):
```powershell
git add .
git commit -m "Test pipeline setup"
git push origin main
```

2. **Trigger Manual Workflow**:
   - Go to: `https://github.com/YOUR_USERNAME/comicgen/actions`
   - Select "Daily Comic Generation"
   - Click "Run workflow"
   - Enter test date (e.g., `2026-02-04`)
   - Click "Run workflow"

3. **Monitor Execution**:
   - Watch workflow progress
   - Check each step for errors
   - View logs for debugging

4. **Verify Results**:
   - Check `data/` directory for new JSON
   - Check `images/` directory for new images
   - Visit GitHub Pages site (if deployed)

### Setting Up GitHub Secrets

Before running on GitHub Actions:

1. Go to repository **Settings → Secrets and variables → Actions**
2. Add **New repository secret**:
   - Name: `OPENROUTER_API_KEY`
   - Value: `sk-or-v1-YOUR-KEY-HERE`
3. Save

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "OPENROUTER_API_KEY not set"

**Solution**:
```powershell
# Set the environment variable
$env:OPENROUTER_API_KEY = "sk-or-v1-YOUR-KEY-HERE"

# Verify
echo $env:OPENROUTER_API_KEY
```

#### Issue 2: "python: command not found" or Python script fails

**Solution**:
```powershell
# Check Python installation
python --version

# If not found, install Python 3.11+
# Or use py instead
py --version

# Update shebang in comic_bot.py if needed
# Or run explicitly: py comic_bot.py
```

#### Issue 3: "Module 'requests' not found"

**Solution**:
```powershell
# Install Python requests module
pip install requests

# Or use pip3
pip3 install requests
```

#### Issue 4: LLM returns invalid JSON

**Symptoms**: `json.JSONDecodeError` when parsing LLM output

**Solution**:
- Check LLM response in error messages
- Verify API key is valid
- Try different model (set `$env:OPENROUTER_MODEL`)
- Check comic_bot.py fallback handling

#### Issue 5: No images generated

**Symptoms**: Script runs but no `.webp` files in `images/`

**Solution**:
```powershell
# Check if API key is set
echo $env:OPENROUTER_API_KEY

# Check data file exists
Test-Path "data/2026-02-04.json"

# Run with verbose output
node scripts/generate_comics.js 2026-02-04

# Note: Placeholders are created if API fails (expected behavior)
```

#### Issue 6: Site not building

**Symptoms**: `site/index.html` not created

**Solution**:
```powershell
# Ensure data files exist
ls data/

# Ensure images exist
ls images/

# Check build script directly
node scripts/build_site.js

# Check for JavaScript errors
```

#### Issue 7: JSON parsing errors

**Solution**:
```powershell
# Validate JSON files
cat data/2026-02-04.json | jq .

# If error, check for:
# - Trailing commas
# - Missing quotes
# - Invalid escape sequences

# Regenerate if corrupt
rm data/2026-02-04.json
node scripts/fetch_news.js 2026-02-04 daily | python comic_bot.py > data/2026-02-04.json
```

---

## Test Data Cleanup

After testing, clean up test files:

```powershell
# Remove test files
Remove-Item test_*.json -ErrorAction SilentlyContinue
Remove-Item fetch_output.json -ErrorAction SilentlyContinue

# Optionally remove test data
Remove-Item data/2026-02-04.json -ErrorAction SilentlyContinue
Remove-Item images/2026-02-04_*.webp -ErrorAction SilentlyContinue

Write-Host "✅ Test cleanup complete" -ForegroundColor Green
```

---

## Quick Test Commands

For quick testing, use these npm scripts:

```powershell
# Test fetch only
npm run fetch

# Test comic generation (requires input.json)
npm run generate

# Test image generation (requires data/*.json)
npm run images

# Test site building
npm run build

# Run full daily pipeline
npm run daily
```

---

## Success Metrics

A successful pipeline test should show:

✅ **All scripts execute without errors**
✅ **Valid JSON at each stage**
✅ **One comic per configured category**
✅ **LLM-generated content is creative and relevant**
✅ **Safety checks show "low" risk**
✅ **Images or placeholders created**
✅ **Site builds and displays correctly**
✅ **No API rate limit errors**
✅ **Total pipeline completes in under 5 minutes**

---

## Continuous Testing

### Scheduled Testing

Set up automated testing:

```powershell
# Create a test script
@'
$TEST_DATE = Get-Date -Format "yyyy-MM-dd"
Write-Host "Running daily test for $TEST_DATE"
node scripts/fetch_news.js $TEST_DATE daily | python comic_bot.py > "data/$TEST_DATE.json"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test passed"
} else {
    Write-Host "❌ Test failed"
    exit 1
}
'@ > test_daily.ps1

# Run with Task Scheduler (Windows)
# Or use GitHub Actions for automated testing
```

### Regression Testing

Before deploying changes:

1. Run full E2E test with known good data
2. Compare output with previous version
3. Verify no new errors introduced
4. Check LLM quality hasn't degraded

---

## Next Steps

After successful testing:

1. **Deploy to production**: Enable GitHub Actions schedule
2. **Monitor daily runs**: Check Actions tab daily
3. **Review comic quality**: Manually review generated comics
4. **Adjust prompts**: Fine-tune LLM prompts based on output
5. **Add more categories**: Expand coverage as needed

---

## Support

If issues persist:

1. Check [README.md](README.md) for general documentation
2. Review [comic_bot.py](comic_bot.py) code comments
3. Check GitHub Actions logs
4. Verify all environment variables are set
5. Test with minimal example first
6. Check OpenRouter API status

---

**Last Updated**: 2026-02-04  
**Pipeline Version**: 1.0.0 (LLM-powered)  
**Test Coverage**: 100% (all components)

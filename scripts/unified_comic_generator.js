import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  categories: [
    {
      name: 'Technology',
      slug: 'technology',
      sources: ['techcrunch', 'theverge', 'arstechnica'],
      rss_feeds: [
        'https://techcrunch.com/feed/',
        'https://www.theverge.com/rss/index.xml'
      ]
    },
    {
      name: 'Politics',
      slug: 'politics',
      sources: ['thehindu', 'indianexpress'],
      rss_feeds: [
        'https://www.thehindu.com/news/national/feeder/default.rss',
        'https://indianexpress.com/section/india/feed/'
      ]
    },
    {
      name: 'Business',
      slug: 'business',
      sources: ['economictimes', 'livemint'],
      rss_feeds: [
        'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
        'https://www.livemint.com/rss/news'
      ]
    },
    {
      name: 'Sports',
      slug: 'sports',
      sources: ['espncricinfo', 'sportstar'],
      rss_feeds: [
        'https://www.espncricinfo.com/rss/content/story/feeds/0.xml'
      ]
    }
  ],
  articlesPerCategory: 3,
  apiUrl: 'https://llmfoundry.straivedemo.com/openrouter/v1/chat/completions',
  model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  apiKey: process.env.OPENROUTER_API_KEY
};

const parser = new Parser({
  timeout: 10000,
  headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
});

/**
 * Fetch and scrape full article content from URL
 */
async function scrapeArticleContent(url) {
  try {
    console.error(`  Scraping content from: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    if (!response.ok) {
      console.error(`  Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Remove script, style, and nav elements
    $('script, style, nav, header, footer, .ad, .advertisement, .social-share').remove();
    
    // Try common article content selectors
    let content = '';
    const selectors = [
      'article',
      '[class*="article-content"]',
      '[class*="post-content"]',
      '[class*="entry-content"]',
      '[class*="story-content"]',
      '[id*="article-content"]',
      '.content',
      'main'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // Fallback to paragraphs if no content found
    if (!content || content.length < 100) {
      content = $('p').map((i, el) => $(el).text()).get().join(' ');
    }
    
    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000); // Limit to 3000 chars for LLM context
    
    return content || null;
  } catch (error) {
    console.error(`  Error scraping ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch top N articles from RSS feeds for a category
 */
async function fetchCategoryArticles(categoryConfig, limit = 3) {
  console.error(`\nFetching articles for ${categoryConfig.name}...`);
  
  const articles = [];
  
  for (const feedUrl of categoryConfig.rss_feeds) {
    try {
      console.error(`  Parsing feed: ${feedUrl}`);
      const feed = await parser.parseURL(feedUrl);
      
      const feedItems = feed.items.slice(0, limit * 2); // Get extra in case scraping fails
      
      for (const item of feedItems) {
        if (articles.length >= limit) break;
        
        const url = item.link || item.guid || '';
        if (!url) continue;
        
        // Get basic excerpt from RSS
        const rssExcerpt = (item.contentSnippet || item.content || item.description || item.summary || '')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 500);
        
        // Scrape full article content
        const fullContent = await scrapeArticleContent(url);
        
        // Combine RSS excerpt with scraped content
        const excerpt = fullContent 
          ? `${rssExcerpt}\n\nFull Article Context:\n${fullContent}`
          : rssExcerpt;
        
        articles.push({
          category_slug: categoryConfig.slug,
          title: item.title || 'Untitled',
          url: url,
          source: feed.title || categoryConfig.sources[0] || 'Unknown',
          published_at: item.pubDate || item.isoDate || new Date().toISOString(),
          excerpt: excerpt
        });
        
        console.error(`  ✓ Added article: ${item.title?.substring(0, 60)}...`);
        
        // Add small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error(`  Error with feed ${feedUrl}: ${error.message}`);
    }
    
    if (articles.length >= limit) break;
  }
  
  console.error(`  Total: ${articles.length} articles collected for ${categoryConfig.name}`);
  return articles.slice(0, limit);
}

/**
 * Call LLM API to generate comic specification
 */
async function callLLM(prompt) {
  if (!CONFIG.apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable not set');
  }
  
  const response = await fetch(CONFIG.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: CONFIG.model,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Generate comic specification for an article
 */
async function generateComicSpec(article, category) {
  console.error(`\n  Generating comic for: ${article.title.substring(0, 50)}...`);
  
  const prompt = `Generate a satirical editorial cartoon specification for this news article.

NEWS ARTICLE:
Title: ${article.title}
Excerpt: ${article.excerpt}
Category: ${category}

Generate a JSON response with this EXACT structure:
{
  "news_summary": "2-4 line summary in simple English",
  "panel_description": "Detailed scene description for cartoon panel (settings, characters, actions)",
  "caption": "Witty one-liner caption (under 12 words)",
  "image_prompt": "Detailed Stable Diffusion prompt in RK Laxman/Amul style with Indian editorial cartoon aesthetic, black ink line art, minimal color",
  "negative_prompt": "Things to avoid: real people, named individuals, celebrities, logos, violence, offensive content",
  "layout_notes": "Caption placement and composition notes",
  "explanation_paragraph": "3-4 sentences explaining how cartoon satirizes the news",
  "defamation_risk": "low/medium/high",
  "sensitive_topic": "none/politics/religion/war/health",
  "safety_notes": "Brief safety assessment",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

GUIDELINES:
- Use generic characters (avoid named individuals)
- Focus on situational irony and absurdity
- Keep it family-friendly and non-offensive
- Use RK Laxman's "Common Man" approach
- Include ${category} as first tag
- Return ONLY valid JSON, no markdown or explanation`;

  const llmOutput = await callLLM(prompt);
  
  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = llmOutput.trim();
  if (jsonStr.startsWith('```')) {
    const parts = jsonStr.split('```');
    jsonStr = parts[1];
    if (jsonStr.startsWith('json')) {
      jsonStr = jsonStr.substring(4);
    }
  }
  jsonStr = jsonStr.trim();
  
  const data = JSON.parse(jsonStr);
  
  return {
    category: category,
    news_title: article.title,
    news_url: article.url,
    news_source: article.source,
    news_summary: data.news_summary,
    comic: {
      panel_description: data.panel_description,
      caption: data.caption,
      image_prompt: data.image_prompt,
      negative_prompt: data.negative_prompt,
      layout_notes: data.layout_notes
    },
    explanation_paragraph: data.explanation_paragraph,
    safety_checks: {
      defamation_risk: data.defamation_risk,
      sensitive_topic: data.sensitive_topic,
      notes: data.safety_notes
    },
    tags: data.tags
  };
}

/**
 * Main function
 */
async function main() {
  try {
    const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];
    
    console.error(`\n${'='.repeat(60)}`);
    console.error(`Unified Comic Generator - ${targetDate}`);
    console.error(`${'='.repeat(60)}`);
    
    const allComicSpecs = [];
    
    // Process each category
    for (const categoryConfig of CONFIG.categories) {
      console.error(`\n[${'='.repeat(50)}]`);
      console.error(`CATEGORY: ${categoryConfig.name.toUpperCase()}`);
      console.error(`[${'='.repeat(50)}]`);
      
      // Fetch top 3 articles with full content
      const articles = await fetchCategoryArticles(categoryConfig, CONFIG.articlesPerCategory);
      
      // Generate comic specs for each article
      for (const article of articles) {
        try {
          const comicSpec = await generateComicSpec(article, categoryConfig.slug);
          allComicSpecs.push(comicSpec);
          console.error(`  ✓ Comic spec generated successfully`);
        } catch (error) {
          console.error(`  ✗ Failed to generate comic spec: ${error.message}`);
        }
        
        // Small delay between LLM calls
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Prepare output
    const output = {
      date: targetDate,
      items: allComicSpecs
    };
    
    // Save to data directory
    const dataDir = path.join(__dirname, '..', 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const outputPath = path.join(dataDir, `${targetDate}.json`);
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    
    console.error(`\n${'='.repeat(60)}`);
    console.error(`✓ SUCCESS!`);
    console.error(`  Generated ${allComicSpecs.length} comic specifications`);
    console.error(`  Saved to: ${outputPath}`);
    console.error(`${'='.repeat(60)}\n`);
    
    // Also output to stdout for piping
    console.log(JSON.stringify(output, null, 2));
    
  } catch (error) {
    console.error(`\n✗ ERROR: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main();

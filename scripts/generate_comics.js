import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REFERENCE_IMAGE_PATH = path.join(__dirname, '..', 'images', 'reference_characters.png');
let referenceImageBase64 = null;

try {
  const imageBuffer = fs.readFileSync(REFERENCE_IMAGE_PATH);
  referenceImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  console.error('✓ Reference character image loaded successfully');
} catch (error) {
  console.error(`⚠ Warning: Could not load reference image: ${error.message}`);
}

const generateImage = async (comicSpec, outputPath) => {
  console.error(`Generating image for ${comicSpec.category}...`);
  console.error(`Prompt: ${comicSpec.comic.image_prompt.substring(0, 100)}...`);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable not set');
  }
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://llmfoundry.straivedemo.com/openrouter/v1';
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-image';
  console.error(`Using API: ${baseUrl}`);
  console.error(`Model: ${model}`);
  
  const systemPrompt = `You are a professional editorial cartoonist specializing in RK Laxman style cartoons. 
Generate images with:
- PURE BLACK INK LINE ART ONLY - absolutely NO COLOR whatsoever
- White background with black lines only
- Simple, clean monochrome line drawings
- Bold, expressive characters in classic Indian editorial style
- Clean, uncluttered composition
- Consistent line weight and stroke style across ALL images
- Witty visual storytelling
- Family-friendly content

IMPORTANT: Use the reference character image provided to maintain EXACT consistent character designs across all comics. The reference shows 4 character types:
1. THE COMMON MAN - Middle-aged Indian man in dhoti-kurta, glasses, balding
2. THE BUREAUCRAT - Portly man in safari suit, thick mustache
3. THE TECHIE - Young person in casual shirt, messy hair, with laptop/phone
4. THE POLITICIAN - Figure in white kurta-pajama, folded hands

Match the EXACT visual style, proportions, line weight, and design of these characters from the reference image. All comics must look like they're drawn by the same artist.`;

  const fullPrompt = `${systemPrompt}

Image Generation Request:
${comicSpec.comic.image_prompt}

Caption to incorporate: "${comicSpec.comic.caption}"

STRICT Style Requirements:
- Use EXACT character designs from the reference image
- Maintain IDENTICAL art style across all comics - same line weight, same stroke style
- PURE BLACK INK LINE ART ONLY on white background
- ABSOLUTELY NO COLOR - monochrome only
- NO shading, NO grayscale, NO gradients
- Simple clean black lines on white background
- Bold, expressive characters
- Clean composition
- Classic Indian editorial cartoon aesthetic
- All comics must look like they're from the same artist's pen

Strictly Avoid: ${comicSpec.comic.negative_prompt}

Generate and must return a complete image that can be used directly as an editorial cartoon, using the reference character designs provided.`;
  let messageContent;
  if (referenceImageBase64) {
    messageContent = [
      {type: 'text',text: fullPrompt},
      {type: 'image_url', image_url: { url: referenceImageBase64, detail: 'high' }}
    ];
  } else { messageContent = fullPrompt; }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/comicgen', 'X-Title': 'Daily News Comic Bot'
    },
    body: JSON.stringify({ model, messages: [  { role: 'user', content: messageContent } ] })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Details:`, {
      status: response.status,
      statusText: response.statusText,
      response: errorText.substring(0, 500)
    });
    throw new Error(`API request failed (${response.status} ${response.statusText}): ${errorText.substring(0, 200)}`);
  }
  const data = await response.json();
  const message = data.choices?.[0]?.message;
  
  if (!message) { throw new Error('No message received from API'); }
  let imageUrl = null;
  if (message.images?.[0]?.image_url?.url) {
    imageUrl = message.images[0].image_url.url;
  } else if (message.content?.includes('data:image')) {
    imageUrl = message.content;
  } else if (message.content) {
    fs.writeFileSync(outputPath.replace('.webp', '.txt'), message.content);
    console.error(`Text response saved to ${outputPath.replace('.webp', '.txt')}`);
  }

  if (imageUrl) {
    let imageBuffer;
    if (imageUrl.startsWith('data:image')) {
      const base64Data = imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (imageUrl.startsWith('http')) {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status}`);
      }
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    if (imageBuffer) {
      await sharp(imageBuffer)
        .webp({  quality: 80,  effort: 6, lossless: false}).toFile(outputPath);
      const stats = fs.statSync(outputPath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      console.error(`✓ Image saved to ${outputPath} (${fileSizeKB} KB)`);
    }
  } else {
    throw new Error('No image generated by API');
  }
};

const processDay = async (dateStr) => {
  const dataPath = path.join(__dirname, '..', 'data', `${dateStr}.json`);
  const imagesDir = path.join(__dirname, '..', 'images');
  if (!fs.existsSync(imagesDir)) { fs.mkdirSync(imagesDir, { recursive: true }); }
  if (!fs.existsSync(dataPath)) { throw new Error(`No data file found for ${dateStr}`); }
  const buffer = fs.readFileSync(dataPath);
  let content;
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le').replace(/^\uFEFF/, '');
  } else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    content = buffer.toString('utf8').replace(/^\uFEFF/, '');
  } else {
    content = buffer.toString('utf8').replace(/^\uFEFF/, '');
  }
  
  const data = JSON.parse(content);
  console.error(`\n📰 Processing ${data.items.length} comics for ${dateStr}...\n`);
  // Generate images for each comic sequentially
  const results = [];
  const categoryCounters = {}; // Track count per category
  for (const item of data.items) {
    // Increment counter for this category
    if (!categoryCounters[item.category]) {
      categoryCounters[item.category] = 0;
    }
    categoryCounters[item.category]++;
    const imagePath = path.join(imagesDir, `${dateStr}_${item.category}_${categoryCounters[item.category]}.webp`);
    try {
      await generateImage(item, imagePath);
      results.push({ category: item.category, status: 'success', path: imagePath });
    } catch (error) {
      console.error(`✗ Failed to generate ${item.category} #${categoryCounters[item.category]}: ${error.message}`);
      results.push({ category: item.category, status: 'failed', error: error.message });
      throw error; // Re-throw to fail the process
    }
  }
  console.error(`\n✓ Completed image generation for ${dateStr}`);
  return results;
};

const main = async () => {
  const targetDate = process.argv[2] || new Date().toISOString().split('T')[0];
  console.error(`🎨 Daily News Comic Image Generator`);
  console.error(`Target Date: ${targetDate}\n`);
  const results = await processDay(targetDate);
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  console.error(`\n📊 Summary: ${successful} successful, ${failed} failed`);
  if (failed > 0) {  process.exit(1); }
};

// Run main function
main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
export { generateImage, processDay };

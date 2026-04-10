import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimum HTML size (bytes) to consider capture successful (not just a loading skeleton)
const MIN_CONTENT_SIZE = 50 * 1024; // 50KB

// Simple HTTP server to serve dist folder
function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Serve index.html for all requests (SPA routing)
      let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);

      // Security: prevent directory traversal
      if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
        };
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } else {
        // Fallback to index.html for SPA routing
        const indexPath = path.join(__dirname, 'dist', 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    });

    server.listen(port, () => {
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function capturePage(page, url) {
  console.log('📄 Loading landing page (waiting for network idle)...');

  try {
    // networkidle2: waits until no more than 2 network requests for at least 500ms
    // This ensures Supabase queries have had a chance to fire and complete
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
  } catch (navError) {
    console.log('⚠️  Network idle timeout, continuing with what loaded...');
  }

  // Wait for the pricing section heading to appear — this renders only after Supabase
  // data (or DEFAULTS) has been applied by React, confirming the app fully hydrated
  try {
    await page.waitForSelector('section#harga h2', { timeout: 20000 });
    console.log('✅ Pricing section detected — React hydration complete');
  } catch (e) {
    console.log('⚠️  Pricing section not detected within 20s, continuing anyway...');
  }

  // Extra buffer for Supabase data (pricing, FAQs, testimonials) to render
  console.log('⏳ Waiting for Supabase data to settle (8s)...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  const html = await page.content();

  // Verify captured content is meaningful (not just a loading skeleton)
  if (html.length < MIN_CONTENT_SIZE) {
    throw new Error(
      `Captured HTML too small: ${html.length} bytes (min: ${MIN_CONTENT_SIZE} bytes). ` +
      `Likely captured a loading state. Retrying...`
    );
  }

  return html;
}

(async () => {
  let server = null;
  try {
    console.log('🚀 Starting landing page capture for bots...');

    // Start temporary HTTP server
    console.log('🌐 Starting temporary HTTP server...');
    const { server: httpServer, port } = await startServer(3333);
    server = httpServer;
    console.log(`✅ Server running on http://localhost:${port}`);

    // Launch headless browser
    console.log('🔄 Launching headless browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });

    const url = `http://localhost:${port}`;
    const MAX_RETRIES = 3;
    let html = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`\n🔁 Capture attempt ${attempt}/${MAX_RETRIES}...`);
        html = await capturePage(page, url);
        console.log(`✅ Capture successful on attempt ${attempt}`);
        break;
      } catch (err) {
        console.log(`❌ Attempt ${attempt} failed: ${err.message}`);
        if (attempt < MAX_RETRIES) {
          console.log('⏳ Waiting 5s before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    await browser.close();

    if (!html) {
      throw new Error(`All ${MAX_RETRIES} capture attempts failed. Build continues without snapshot.`);
    }

    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Save to dist/index.html (overwrites SPA HTML with rendered snapshot)
    const distPath = path.join(distDir, 'index.html');
    fs.writeFileSync(distPath, html);

    console.log('\n✅ Landing page captured successfully!');
    console.log(`📍 Location: ${distPath}`);
    console.log(`📊 File size: ${(html.length / 1024).toFixed(2)} KB`);

    // Close the server
    server.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to capture landing page:', error.message);
    console.log('ℹ️  Build will continue — static fallback in index.html will serve bots');

    if (server) {
      server.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
  }
})();

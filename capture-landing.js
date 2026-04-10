import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const content = fs.readFileSync(filePath);
        res.writeHead(200);
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
    console.log('🔄 Launching browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to landing page
    // Use 'domcontentloaded' instead of 'networkidle2' since Supabase calls may take time
    console.log('📄 Loading landing page...');
    try {
      await page.goto(`http://localhost:${port}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
    } catch (navError) {
      // If navigation fails, still try to wait a bit and capture what we have
      console.log('⚠️  Navigation took longer than expected, continuing anyway...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('✅ Page content loaded, waiting for data to settle...');
    // Wait for Supabase queries to complete (pricing, content, etc.)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get rendered HTML
    const html = await page.content();

    // Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Save to dist/index.html (overwrites SPA HTML with static snapshot)
    const distPath = path.join(distDir, 'index.html');
    fs.writeFileSync(distPath, html);

    console.log('✅ Landing page captured successfully!');
    console.log(`📍 Location: ${distPath}`);
    console.log(`📊 File size: ${(html.length / 1024).toFixed(2)} KB`);

    await browser.close();

    // Close the server
    server.close(() => {
      console.log('🛑 Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to capture landing page:', error.message);
    console.log('ℹ️  Build will continue - bot readability not affected');

    if (server) {
      server.close(() => process.exit(0));
    } else {
      process.exit(0);
    }
  }
})();

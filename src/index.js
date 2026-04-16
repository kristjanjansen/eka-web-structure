import { execFileSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateHtml } from './visualization.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'docs');

const args = process.argv.slice(2);
const SKIP_STRUCTURE = args.includes('--skip-structure');
const SKIP_VIS = args.includes('--skip-vis');

function run(script) {
  const passthrough = args.filter(a =>
    a.startsWith('--max=') || a.startsWith('--concurrency=') ||
    a === '--skip-api'
  );
  execFileSync('node', [join(__dirname, script), ...passthrough], {
    stdio: 'inherit',
    cwd: PROJECT_ROOT,
  });
}

// Stage 1: Structure
if (!SKIP_STRUCTURE) {
  run('crawl-structure.js');
}

// Stage 2: Visualization
if (!SKIP_VIS) {
  const sitemapPath = join(OUTPUT_DIR, 'sitemap.json');
  const sitemap = JSON.parse(readFileSync(sitemapPath, 'utf8'));
  const htmlPath = join(OUTPUT_DIR, 'index.html');
  writeFileSync(htmlPath, generateHtml(sitemap));
  console.log(`  Wrote ${htmlPath}\n`);
}

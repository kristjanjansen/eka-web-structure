import { load } from 'cheerio';
import TurndownService from 'turndown';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── URL utilities (inlined) ───

const SITE_HOSTNAME = 'www.artun.ee';
const SITE_HOSTNAME_ALT = 'artun.ee';

const SKIP_PATHS = [
  '/wp-admin', '/wp-login.php', '/wp-json', '/feed',
  '/wp-content/uploads', '/wp-includes', '/xmlrpc.php',
  '/wp-cron.php', '/wp-trackback.php',
];

const SKIP_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.gz', '.tar',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv',
  '.css', '.js', '.xml', '.rss', '.atom',
]);

const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'mc_cid', 'mc_eid',
]);

function normalizeUrl(urlString, base) {
  try {
    const url = new URL(urlString, base);
    url.protocol = 'https:';
    if (url.hostname === SITE_HOSTNAME_ALT) url.hostname = SITE_HOSTNAME;
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';
    for (const param of TRACKING_PARAMS) url.searchParams.delete(param);
    url.searchParams.sort();
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    url.pathname = path;
    return url.toString();
  } catch { return null; }
}

function isInternalUrl(urlString) {
  try {
    const host = new URL(urlString).hostname.toLowerCase();
    return host === SITE_HOSTNAME || host === SITE_HOSTNAME_ALT;
  } catch { return false; }
}

function isEstonianUrl(urlString) {
  try {
    const path = new URL(urlString).pathname.toLowerCase();
    return path === '/' || path === '/et' || path.startsWith('/et/');
  } catch { return false; }
}

function shouldSkipUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!url.protocol.startsWith('http')) return true;
    const path = url.pathname.toLowerCase();
    for (const skip of SKIP_PATHS) { if (path.startsWith(skip)) return true; }
    const lastSegment = path.split('/').pop();
    const dotIdx = lastSegment.lastIndexOf('.');
    if (dotIdx > 0 && SKIP_EXTENSIONS.has(lastSegment.slice(dotIdx).toLowerCase())) return true;
    const pageMatch = path.match(/\/page\/(\d+)/);
    if (pageMatch && parseInt(pageMatch[1]) > 5) return true;
    return false;
  } catch { return true; }
}

function classifyUrl(href, base) {
  const trimmed = href.trim();
  if (/^(mailto:|tel:|javascript:|#$|#[^/])/.test(trimmed)) return { type: 'skip', normalized: null };
  const normalized = normalizeUrl(trimmed, base);
  if (!normalized) return { type: 'skip', normalized: null };
  if (!isInternalUrl(normalized)) return { type: 'external', normalized };
  if (shouldSkipUrl(normalized)) return { type: 'skip', normalized };
  if (isEstonianUrl(normalized)) return { type: 'internal-et', normalized };
  return { type: 'internal-other', normalized };
}

function urlToFilename(url, index) {
  try {
    const u = new URL(url);
    const slug = u.pathname.replace(/^\//, '').replace(/\/$/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'root';
    return String(index).padStart(3, '0') + '-' + slug + '.md';
  } catch { return String(index).padStart(3, '0') + '-unknown.md'; }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OUTPUT_DIR = join(PROJECT_ROOT, 'docs');
const CONTENT_DIR = join(OUTPUT_DIR, 'content');

const START_URL = 'https://www.artun.ee/et/avaleht/';
const MAX_PAGES = parseInt(process.argv.find(a => a.startsWith('--max='))?.split('=')[1] || '2000');
const CONCURRENCY = parseInt(process.argv.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '8');
const SKIP_API = process.argv.includes('--skip-api');
const DELAY_MIN = 200;
const DELAY_MAX = 500;

const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
turndown.remove(['script', 'style', 'nav', 'iframe', 'noscript', 'svg']);

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
];

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }
function delay() { return new Promise(r => setTimeout(r, DELAY_MIN + Math.random() * (DELAY_MAX - DELAY_MIN))); }
function norm(url) { return normalizeUrl(url) || url; }

// ─── Shared HTML parser ───

function parsePage(html, baseUrl) {
  const $ = load(html);
  const title = $('title').first().text().trim();

  // Meta tags
  const meta = {
    description: $('meta[property="og:description"]').attr('content')
      || $('meta[name="description"]').attr('content') || null,
    image: $('meta[property="og:image"]').attr('content')
      || $('meta[name="twitter:image"]').attr('content') || null,
    type: $('meta[property="og:type"]').attr('content') || null,
  };

  const textLength = $('body').text().length;
  const imageCount = $('img').length;
  const estimatedHeight = Math.round(Math.max(400, textLength * 0.15 + imageCount * 300));

  // Breadcrumbs (before DOM mutation)
  const breadcrumbs = [];
  $('.breadcrumbs span[property="itemListElement"]').each((_, el) => {
    const name = $(el).find('span[property="name"]').text().trim();
    if (name) breadcrumbs.push(name);
  });
  if (breadcrumbs.length > 0 && breadcrumbs[breadcrumbs.length - 1] === title.split('—')[0].trim()) {
    breadcrumbs.pop();
  }

  // Links (before DOM mutation — nav/sidebar get removed for markdown)
  const internalLinks = [];
  const externalLinks = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const result = classifyUrl(href, baseUrl);
    if (result.type === 'internal-et') internalLinks.push(result.normalized);
    else if (result.type === 'external') externalLinks.push(result.normalized);
  });

  // Main content → markdown
  const contentSelectors = [
    'main', 'article', '.entry-content', '.post-content',
    '.page-content', '#content', '.content-area', '[role="main"]',
  ];
  let contentHtml = '';
  for (const sel of contentSelectors) {
    const el = $(sel).first();
    if (el.length) {
      el.find('header, footer, nav, .cookie-law-info-bar, .menu, .sidebar').remove();
      contentHtml = el.html();
      break;
    }
  }
  if (!contentHtml) {
    const body = $('body').clone();
    body.find('header, footer, nav, .cookie-law-info-bar, .menu, .sidebar, script, style').remove();
    contentHtml = body.html() || '';
  }

  let markdown = '';
  try { markdown = turndown.turndown(contentHtml).trim().replace(/\n{3,}/g, '\n\n'); } catch {}

  // Fallback description from first paragraph
  if (!meta.description && markdown) {
    const lines = markdown.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('['));
    if (lines.length > 0) {
      meta.description = lines[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim().slice(0, 200);
    }
  }

  return {
    title, meta, estimatedHeight, breadcrumbs, markdown,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
  };
}

// ─── HTTP fetch ───

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA(), 'Accept': 'text/html', 'Accept-Language': 'et-EE,et;q=0.9' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const finalUrl = res.url;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) return { finalUrl, html: '', error: 'not-html' };
    const html = await res.text();
    return { finalUrl, html, error: null };
  } catch (err) {
    clearTimeout(timeout);
    return { finalUrl: url, html: '', error: err.message };
  }
}

// ─── Build page record ───

function buildPageRecord(url, finalUrl, parsed, depth, contentDir, pageIdx) {
  let contentFile = null;
  if (parsed.markdown) {
    const mdFilename = urlToFilename(finalUrl, pageIdx);
    contentFile = `content/${mdFilename}`;
    const frontmatter = `---\ntitle: ${JSON.stringify(parsed.title)}\nurl: ${finalUrl}\ndepth: ${depth}\ndate: ${new Date().toISOString().slice(0, 10)}\n---\n\n`;
    writeFileSync(join(contentDir, mdFilename), frontmatter + parsed.markdown);
  }

  return {
    url, finalUrl, title: parsed.title, meta: parsed.meta,
    estimatedHeight: parsed.estimatedHeight, breadcrumbs: parsed.breadcrumbs,
    contentFile, screenshot: null, pageHeight: null,
    internalLinks: parsed.internalLinks, externalLinks: parsed.externalLinks,
    depth, error: null,
  };
}

// ─── Stage A: BFS crawl ───

async function crawlBFS(pages, visited, pageIndex) {
  console.log(`\n  ── Stage A: BFS Crawl ──`);
  console.log(`  Start: ${START_URL}`);
  console.log(`  Max: ${MAX_PAGES}, Concurrency: ${CONCURRENCY}\n`);

  const queue = [];
  const seedNorm = norm(START_URL);
  queue.push({ url: seedNorm, depth: 0 });
  let activeWorkers = 0;

  async function worker() {
    while (true) {
      let next = null;
      while (queue.length > 0) {
        const candidate = queue.shift();
        if (!visited.has(candidate.url)) { next = candidate; break; }
      }
      if (!next) {
        if (activeWorkers > 0) { await new Promise(r => setTimeout(r, 200)); continue; }
        break;
      }
      if (pages.length >= MAX_PAGES) break;

      visited.add(next.url);
      activeWorkers++;
      pageIndex.val++;

      const { finalUrl, html, error } = await fetchPage(next.url);

      if (error) {
        if (pageIndex.val <= 5) console.log(`  [${pageIndex.val}] ERR d=${next.depth} ${next.url}`);
        pages.push({
          url: next.url, finalUrl, title: '', meta: {}, estimatedHeight: 0,
          breadcrumbs: [], contentFile: null, screenshot: null, pageHeight: null,
          internalLinks: [], externalLinks: [], depth: next.depth, error,
        });
        activeWorkers--;
        await delay();
        continue;
      }

      const normFinal = norm(finalUrl);
      if (normFinal && isInternalUrl(normFinal) && isEstonianUrl(normFinal)) {
        visited.add(normFinal);
      } else {
        activeWorkers--;
        await delay();
        continue;
      }

      const parsed = parsePage(html, finalUrl);

      if (pageIndex.val % 50 === 0 || pageIndex.val <= 5) {
        console.log(`  [${pageIndex.val}/${MAX_PAGES}] d=${next.depth} ${next.url}`);
      }

      for (const link of parsed.internalLinks) {
        if (!visited.has(link)) queue.push({ url: link, depth: next.depth + 1 });
      }

      const record = buildPageRecord(next.url, normFinal, parsed, next.depth, CONTENT_DIR, pageIndex.val);
      pages.push(record);

      activeWorkers--;
      await delay();
    }
  }

  const startTime = Date.now();
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  BFS done: ${pages.length} pages in ${duration}s (max depth ${Math.max(0, ...pages.map(p => p.depth))})`);
}

// ─── Stage B: Fill gaps from WP REST API ───

async function fillFromAPI(pages, visited, pageIndex) {
  console.log(`\n  ── Stage B: WP API Gap Fill ──`);
  console.log(`  Fetching page list from API...`);

  const allWp = [];
  let p = 1;
  while (true) {
    const res = await fetch(
      `https://www.artun.ee/wp-json/wp/v2/pages?per_page=100&page=${p}&_fields=id,link,title`,
      { headers: { 'User-Agent': randomUA() } }
    );
    if (!res.ok) break;
    const items = await res.json();
    if (!items.length) break;
    allWp.push(...items);
    p++;
    if (p > 20) break;
  }

  const etPages = allWp.filter(wp => wp.link.includes('/et/'));
  const missing = etPages.filter(wp => !visited.has(norm(wp.link)));

  console.log(`  WP Estonian pages: ${etPages.length}`);
  console.log(`  Already have: ${etPages.length - missing.length}`);
  console.log(`  Missing: ${missing.length}\n`);

  if (missing.length === 0) return;

  let idx = 0;
  let done = 0;
  let added = 0;
  const startTime = Date.now();

  async function worker() {
    while (true) {
      const i = idx++;
      if (i >= missing.length) break;
      const wp = missing[i];
      const url = norm(wp.link);
      done++;

      if (done % 20 === 0 || done <= 3) {
        console.log(`  [${done}/${missing.length}] ${url}`);
      }

      const { finalUrl, html, error } = await fetchPage(url);

      if (error) {
        pages.push({
          url, finalUrl: url, title: wp.title?.rendered || '', meta: {},
          estimatedHeight: 0, breadcrumbs: [], contentFile: null,
          screenshot: null, pageHeight: null,
          internalLinks: [], externalLinks: [], depth: -1, error,
        });
        await delay();
        continue;
      }

      const normFinal = norm(finalUrl);
      const parsed = parsePage(html, finalUrl);

      visited.add(url);
      visited.add(normFinal);
      pageIndex.val++;

      const record = buildPageRecord(url, normFinal, parsed, -1, CONTENT_DIR, pageIndex.val);
      pages.push(record);
      added++;

      await delay();
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  API fill done: ${added} new pages added in ${duration}s`);
}

// ─── Main ───

async function main() {
  console.log(`\n  ═══ EKA Structure Crawler ═══`);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(CONTENT_DIR, { recursive: true });

  const pages = [];
  const visited = new Set();
  const pageIndex = { val: 0 };

  const totalStart = Date.now();

  // Stage A: BFS crawl from homepage
  await crawlBFS(pages, visited, pageIndex);

  // Stage B: Fill gaps from WP API
  if (!SKIP_API) {
    await fillFromAPI(pages, visited, pageIndex);
  }

  // ── Stage C: Compute link graph metadata ──
  console.log(`\n  ── Stage C: Link Analysis ──`);

  const urlIndex = new Map();
  pages.forEach((p, i) => {
    urlIndex.set(p.url, i);
    if (p.finalUrl) urlIndex.set(p.finalUrl, i);
  });

  const inboundCounts = new Array(pages.length).fill(0);
  const inboundFrom = pages.map(() => []);

  pages.forEach((p, srcIdx) => {
    const seen = new Set();
    for (const link of p.internalLinks) {
      const tgtIdx = urlIndex.get(link);
      if (tgtIdx !== undefined && tgtIdx !== srcIdx && !seen.has(tgtIdx)) {
        seen.add(tgtIdx);
        inboundCounts[tgtIdx]++;
        inboundFrom[tgtIdx].push(p.url);
      }
    }
  });

  let orphanCount = 0;
  pages.forEach((p, i) => {
    p.inboundLinks = inboundCounts[i];
    p.orphan = inboundCounts[i] === 0 && p.depth !== 0;
    p.linkedFrom = inboundFrom[i].slice(0, 5);
    if (p.orphan) orphanCount++;
  });

  console.log(`  Orphan pages (0 inbound links): ${orphanCount}`);
  console.log(`  Well-linked (5+ inbound): ${pages.filter(p => p.inboundLinks >= 5).length}`);

  const totalDuration = ((Date.now() - totalStart) / 1000).toFixed(1);

  // Write sitemap
  const sitemap = {
    meta: {
      startUrl: START_URL,
      totalPages: pages.length,
      orphanPages: orphanCount,
      crawlDate: new Date().toISOString(),
      durationSeconds: parseFloat(totalDuration),
      screenshotted: false,
    },
    pages: pages.map(p => ({
      url: p.url, finalUrl: p.finalUrl, title: p.title, meta: p.meta || {},
      estimatedHeight: p.estimatedHeight, breadcrumbs: p.breadcrumbs || [],
      contentFile: p.contentFile || null, screenshot: null, pageHeight: null,
      internalLinks: p.internalLinks, externalLinks: p.externalLinks,
      inboundLinks: p.inboundLinks, orphan: p.orphan, linkedFrom: p.linkedFrom,
      depth: p.depth, error: p.error || undefined,
    })),
  };

  const sitemapPath = join(OUTPUT_DIR, 'sitemap.json');
  writeFileSync(sitemapPath, JSON.stringify(sitemap, null, 2));

  console.log(`\n  ═══ Complete ═══`);
  console.log(`  ${pages.length} pages in ${totalDuration}s`);
  console.log(`  Wrote ${sitemapPath}\n`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });

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

export function normalizeUrl(urlString, base) {
  try {
    const url = new URL(urlString, base);

    // Force https
    url.protocol = 'https:';

    // Force www
    if (url.hostname === SITE_HOSTNAME_ALT) {
      url.hostname = SITE_HOSTNAME;
    }

    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();

    // Remove fragment
    url.hash = '';

    // Remove tracking params
    for (const param of TRACKING_PARAMS) {
      url.searchParams.delete(param);
    }

    // Sort remaining params for consistency
    url.searchParams.sort();

    // Strip trailing slash except for root
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    url.pathname = path;

    return url.toString();
  } catch {
    return null;
  }
}

export function isInternalUrl(urlString) {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    return host === SITE_HOSTNAME || host === SITE_HOSTNAME_ALT;
  } catch {
    return false;
  }
}

export function isEstonianUrl(urlString) {
  try {
    const url = new URL(urlString);
    const path = url.pathname.toLowerCase();
    return path === '/' || path === '/et' || path.startsWith('/et/');
  } catch {
    return false;
  }
}

export function shouldSkipUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Non-http schemes
    if (!url.protocol.startsWith('http')) return true;

    const path = url.pathname.toLowerCase();

    // Skip known non-page paths
    for (const skip of SKIP_PATHS) {
      if (path.startsWith(skip)) return true;
    }

    // Skip file extensions
    const lastSegment = path.split('/').pop();
    const dotIdx = lastSegment.lastIndexOf('.');
    if (dotIdx > 0) {
      const ext = lastSegment.slice(dotIdx).toLowerCase();
      if (SKIP_EXTENSIONS.has(ext)) return true;
    }

    // Skip pagination beyond page 5 (avoid infinite pagination)
    const pageMatch = path.match(/\/page\/(\d+)/);
    if (pageMatch && parseInt(pageMatch[1]) > 5) return true;

    return false;
  } catch {
    return true;
  }
}

export function classifyUrl(href, base) {
  // Skip non-http schemes early
  const trimmed = href.trim();
  if (/^(mailto:|tel:|javascript:|#$|#[^/])/.test(trimmed)) {
    return { type: 'skip', normalized: null };
  }

  const normalized = normalizeUrl(trimmed, base);
  if (!normalized) return { type: 'skip', normalized: null };

  if (!isInternalUrl(normalized)) {
    return { type: 'external', normalized };
  }

  if (shouldSkipUrl(normalized)) {
    return { type: 'skip', normalized };
  }

  if (isEstonianUrl(normalized)) {
    return { type: 'internal-et', normalized };
  }

  return { type: 'internal-other', normalized };
}

export function urlToFilename(url, index) {
  try {
    const u = new URL(url);
    const slug = u.pathname
      .replace(/^\//, '')
      .replace(/\/$/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'root';
    const prefix = String(index).padStart(3, '0');
    return `${prefix}-${slug}.jpg`;
  } catch {
    return `${String(index).padStart(3, '0')}-unknown.jpg`;
  }
}

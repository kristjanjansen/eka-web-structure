export function generateHtml(sitemap) {
  const graphJson = JSON.stringify(sitemap);

  return `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EKA Web Structure — artun.ee</title>
<style>
  @font-face {
    font-family: 'ITCFranklinGothic';
    src: url('./fonts/ITCFranklinGothic-Book.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'ITCFranklinGothic';
    src: url('./fonts/ITCFranklinGothic-Bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: 'EKA-Absolution';
    src: url('./fonts/EKAAbsolution.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #c0c0c0;
    color: #000;
    font-family: 'ITCFranklinGothic', 'Franklin Gothic Medium', 'Arial Narrow', sans-serif;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    cursor: grab;
  }
  body.dragging { cursor: grabbing; }

  #canvas-bg {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 0;
  }

  #clusters-canvas {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 1;
    pointer-events: none;
  }

  #nodes-layer {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 2;
    pointer-events: none;
  }

  #interaction-layer {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    z-index: 3;
    cursor: grab;
  }
  #interaction-layer.dragging { cursor: grabbing; }

  .node {
    position: absolute;
    pointer-events: none;
    width: 66px;
    text-decoration: none;
    color: inherit;
    display: block;
    user-select: none;
    -webkit-user-select: none;
  }
  .node.hovered .node-card { outline: 1px solid #000; }
  .node-card {
    background: #fff;
    width: 66px;
    height: 66px;
    border-radius: 0;
    overflow: hidden;
    padding: 2px 3px;
    transition: none;
  }
  .node-bc {
    font-size: 3px;
    font-weight: 400;
    line-height: 1.1;
    color: #999;
    text-align: left;
    word-break: break-word;
    font-family: 'ITCFranklinGothic', sans-serif;
    margin-bottom: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .node-title {
    font-size: 4.5px;
    font-weight: 400;
    line-height: 1.1;
    text-transform: uppercase;
    color: #000;
    text-align: left;
    word-break: break-word;
    font-family: 'EKA-Absolution', 'ITCFranklinGothic', sans-serif;
  }
  .node-desc {
    font-size: 4px;
    font-weight: 400;
    line-height: 1.15;
    color: #666;
    text-align: left;
    word-break: break-word;
    font-family: 'ITCFranklinGothic', sans-serif;
    margin-top: 1px;
    overflow: hidden;
  }


  #controls {
    position: fixed;
    bottom: 8px; left: 8px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0;
    pointer-events: auto;
  }
  #controls button {
    background: #fff;
    border: none;
    color: #000;
    border-radius: 0;
    width: 20px; height: 20px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.1s, color 0.1s;
    font-family: 'ITCFranklinGothic', sans-serif;
  }
  #controls button + button { border-top: 1px solid #ccc; }

</style>
</head>
<body>

<canvas id="canvas-bg"></canvas>
<canvas id="clusters-canvas"></canvas>
<div id="nodes-layer"></div>
<div id="interaction-layer"></div>


<div id="controls">
  <button id="btn-zoom-in" title="Zoom in">+</button>
  <button id="btn-zoom-out" title="Zoom out">&minus;</button>
  <button id="btn-fit" title="Fit all">&#9635;</button>
</div>

<script>
const DATA = ${graphJson};

const PALETTE = [
  '#000000', '#E8175D', '#00C9A7', '#8B5CF6', '#3B82F6',
  '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#84CC16',
  '#F43F5E', '#A855F7', '#6B7280', '#4B5563',
];

const URL_FALLBACKS = {
  'avaleht': 'Avaleht', 'kalender': 'Kalender',
  'akadeemia': 'Akadeemia', 'erialad': 'Erialad', 'oppekavad': 'Erialad',
  'sisseastumine': 'Sisseastumine', 'vastuvott': 'Sisseastumine',
  'teadus-ja-arendus': 'Teadus ja arendus', 'teadus': 'Teadus ja arendus',
  'raamatukogu': 'Raamatukogu', 'kirjastamine': 'EKA Kirjastus',
  'eka-cvi': 'Akadeemia', 'eka-naitused': 'EKA Näitused',
  'galerii': 'EKA Näitused', 'muuseum': 'Akadeemia',
  'ukraine': 'Akadeemia', 'kontaktid': 'Akadeemia', 'oppetoo': 'Erialad',
  'oppimine': 'Õppimine', 'kategooria': 'Kategooriad',
};

function getCluster(page) {
  const bc = page.breadcrumbs;
  if (bc && bc.length > 0) return bc[0];
  try {
    // Prefer original url for clustering (finalUrl may redirect externally)
    const url = new URL(page.url);
    const useUrl = url.hostname.includes('artun.ee') ? page.url : page.finalUrl;
    const path = new URL(useUrl || page.url).pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'et') parts.shift();
    const seg = parts[0] || 'avaleht';
    if (URL_FALLBACKS[seg]) return URL_FALLBACKS[seg];
    return 'Muu';
  } catch { return 'Muu'; }
}

function getSubcluster(page) {
  const bc = page.breadcrumbs;
  if (bc && bc.length > 1) return bc[1];
  return '_root';
}

const _clusterColorMap = new Map();
let _colorIdx = 0;
function getClusterStyle(name) {
  if (!_clusterColorMap.has(name)) {
    _clusterColorMap.set(name, { name, color: PALETTE[_colorIdx % PALETTE.length] });
    _colorIdx++;
  }
  return _clusterColorMap.get(name);
}

// === State ===
let panX = 0, panY = 0, scale = 1;
let isDragging = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
const NODE_W = 66, NODE_H = 66;
const NODE_PAD = 4;
let dimmedClusters = new Set();

const nodes = DATA.pages.map((p, i) => {
  const cluster = p.orphan ? 'Orvud' : getCluster(p);
  const subcluster = p.orphan ? '_root' : getSubcluster(p);
  const bc = p.breadcrumbs || [];
  const sub2 = (p.orphan || subcluster === '_root') ? '_root' : (bc.length > 2 ? bc[2] : '_root');
  const style = getClusterStyle(cluster);
  return { ...p, id: p.finalUrl || p.url, cluster, subcluster, sub2, clusterStyle: style, x: 0, y: 0, index: i };
});

// Group: cluster → subcluster → sub2 → nodes
const clusterGroups = {};
nodes.forEach(n => {
  if (!clusterGroups[n.cluster]) clusterGroups[n.cluster] = { nodes: [], subs: {} };
  clusterGroups[n.cluster].nodes.push(n);
  const sub = n.subcluster;
  if (!clusterGroups[n.cluster].subs[sub]) clusterGroups[n.cluster].subs[sub] = { nodes: [], subs: {} };
  clusterGroups[n.cluster].subs[sub].nodes.push(n);
  const s2 = n.sub2;
  if (!clusterGroups[n.cluster].subs[sub].subs[s2]) clusterGroups[n.cluster].subs[sub].subs[s2] = [];
  clusterGroups[n.cluster].subs[sub].subs[s2].push(n);
});

const clusterNames = Object.keys(clusterGroups).sort((a, b) => {
  if (a === 'Avaleht') return -1;
  if (b === 'Avaleht') return 1;
  if (a === 'Muu') return 1;
  if (b === 'Muu') return -1;
  return clusterGroups[b].nodes.length - clusterGroups[a].nodes.length;
});

// === Layout with 3-level subclusters ===
const allLabelBounds = []; // {level, label, x, y, w, h}

function layoutClusters() {
  const CLUSTER_PAD = 20;
  const CLUSTER_TITLE_H = 36;
  const L2_TITLE_H = 20;
  const L3_TITLE_H = 14;
  const L2_GAP = 36;
  const L3_GAP = 20;
  const L2_PAD = 8;
  const L3_PAD = 4;
  const CLUSTER_GAP = 200;
  const cellW = NODE_W + NODE_PAD;
  const cellH = NODE_H + NODE_PAD;

  // Pack rects into rows, return positions array + total size
  function packRects(rects, maxRowW, gap) {
    let sx = 0, sy = 0, rowMaxH = 0;
    const positions = [];
    rects.forEach(r => {
      if (sx + r.w > maxRowW && sx > 0) {
        sx = 0; sy += rowMaxH + gap; rowMaxH = 0;
      }
      positions.push({ ...r, x: sx, y: sy });
      sx += r.w + gap;
      rowMaxH = Math.max(rowMaxH, r.h);
    });
    const totalW = positions.length ? Math.max(...positions.map(p => p.x + p.w)) : 0;
    const totalH = positions.length ? Math.max(...positions.map(p => p.y + p.h)) : 0;
    return { positions, totalW, totalH };
  }

  function sortKeys(obj) {
    return Object.keys(obj).sort((a, b) => {
      if (a === '_root') return -1;
      if (b === '_root') return 1;
      const al = Array.isArray(obj[a]) ? obj[a].length : obj[a].nodes.length;
      const bl = Array.isArray(obj[b]) ? obj[b].length : obj[b].nodes.length;
      return bl - al;
    });
  }

  // Level 3: group of nodes → rect
  function layoutL3(nodesArr) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(nodesArr.length)));
    const rows = Math.ceil(nodesArr.length / cols);
    return {
      nodes: nodesArr, cols, rows,
      w: cols * cellW - NODE_PAD + L3_PAD * 2,
      h: rows * cellH - NODE_PAD + L3_PAD * 2 + L3_TITLE_H,
    };
  }

  // Level 2: subcluster with sub-subclusters → rect
  function layoutL2(sub) {
    const s2Names = sortKeys(sub.subs);

    const l3Rects = s2Names.map(s2Name => {
      const r = layoutL3(sub.subs[s2Name]);
      r.subName = s2Name;
      return r;
    });

    const maxW = Math.max(300, Math.sqrt(l3Rects.reduce((s, r) => s + r.w * r.h, 0)) * 1.3);
    const packed = packRects(l3Rects, maxW, L3_GAP);

    return {
      l3s: packed.positions, nodes: null, cols: 0, rows: 0,
      w: packed.totalW + L2_PAD * 2,
      h: packed.totalH + L2_PAD * 2 + L2_TITLE_H,
    };
  }

  // Level 1: cluster with subclusters → rect
  function layoutL1(cg) {
    const subNames = sortKeys(cg.subs);
    const subRects = subNames.map(subName => {
      const r = layoutL2(cg.subs[subName]);
      r.subName = subName;
      return r;
    });

    const maxW = Math.max(400, Math.sqrt(subRects.reduce((s, r) => s + r.w * r.h, 0)) * 1.4);
    const packed = packRects(subRects, maxW, L2_GAP);

    return {
      subPositions: packed.positions,
      w: packed.totalW + CLUSTER_PAD * 2,
      h: packed.totalH + CLUSTER_PAD * 2 + CLUSTER_TITLE_H,
    };
  }

  const clusterRects = clusterNames.map(name => ({ name, ...layoutL1(clusterGroups[name]) }));

  // Pack clusters: Avaleht top, Orvud far right, rest in rows
  const avalehtRect = clusterRects.find(r => r.name === 'Avaleht');
  const orvudRect = clusterRects.find(r => r.name === 'Orvud');
  const rest = clusterRects.filter(r => r.name !== 'Avaleht' && r.name !== 'Orvud');
  rest.sort((a, b) => b.h - a.h || b.w - a.w);

  const positions = new Map();
  let shelfY = 0;

  if (avalehtRect) {
    positions.set(avalehtRect.name, { x: 0, y: 0, rect: avalehtRect });
    shelfY = avalehtRect.h + CLUSTER_GAP;
  }

  let shelfX = 0, shelfMaxH = 0;
  const MAX_ROW_W = Math.max(1800, Math.sqrt(rest.reduce((s, r) => s + r.w * r.h, 0)) * 1.5);

  rest.forEach(rect => {
    if (shelfX + rect.w > MAX_ROW_W && shelfX > 0) {
      shelfX = 0; shelfY += shelfMaxH + CLUSTER_GAP; shelfMaxH = 0;
    }
    positions.set(rect.name, { x: shelfX, y: shelfY, rect });
    shelfX += rect.w + CLUSTER_GAP;
    shelfMaxH = Math.max(shelfMaxH, rect.h);
  });

  // Place Orvud far right, aligned to first row of clusters (below Avaleht)
  if (orvudRect) {
    let maxX = 0;
    positions.forEach(p => { maxX = Math.max(maxX, p.x + p.rect.w); });
    const firstRowY = avalehtRect ? avalehtRect.h + CLUSTER_GAP : 0;
    positions.set(orvudRect.name, { x: maxX + CLUSTER_GAP * 2, y: firstRowY, rect: orvudRect });
  }

  // Center
  let totalMinX = Infinity, totalMaxX = -Infinity, totalMinY = Infinity, totalMaxY = -Infinity;
  positions.forEach(p => {
    totalMinX = Math.min(totalMinX, p.x);
    totalMaxX = Math.max(totalMaxX, p.x + p.rect.w);
    totalMinY = Math.min(totalMinY, p.y);
    totalMaxY = Math.max(totalMaxY, p.y + p.rect.h);
  });
  const offX = -(totalMinX + totalMaxX) / 2;
  const offY = -(totalMinY + totalMaxY) / 2;

  // Position nodes and collect label bounds
  function placeNodes(nodesArr, cols, ox, oy) {
    nodesArr.forEach((n, i) => {
      n.x = ox + (i % cols) * cellW;
      n.y = oy + Math.floor(i / cols) * cellH;
    });
  }

  positions.forEach((pos, clusterName) => {
    const rect = pos.rect;
    rect.subPositions.forEach(sp => {
      const l2x = pos.x + CLUSTER_PAD + sp.x + offX;
      const l2y = pos.y + CLUSTER_TITLE_H + CLUSTER_PAD + sp.y + offY;

      const l2label = sp.subName === '_root' ? clusterName : sp.subName;
      const l2count = clusterGroups[clusterName].subs[sp.subName].nodes.length;
      allLabelBounds.push({ level: 2, label: l2label, count: l2count, x: l2x, y: l2y, w: sp.w, h: sp.h });

      if (sp.l3s) {
        sp.l3s.forEach(l3 => {
          const l3x = l2x + L2_PAD + l3.x;
          const l3y = l2y + L2_TITLE_H + L2_PAD + l3.y;
          const l3count = l3.nodes.length;
          const l3label = l3.subName === '_root' ? l2label : l3.subName;
          // Skip L3 label if it duplicates its parent L2
          if (l3label !== l2label) {
            allLabelBounds.push({ level: 3, label: l3label, count: l3count, x: l3x, y: l3y, w: l3.w, h: l3.h });
          }

          placeNodes(l3.nodes, l3.cols, l3x + L3_PAD, l3y + L3_TITLE_H + L3_PAD);
        });
      }
    });
  });

  window._clusterBounds = new Map();
  positions.forEach((pos, name) => {
    window._clusterBounds.set(name, { x: pos.x + offX, y: pos.y + offY, w: pos.rect.w, h: pos.rect.h });
  });

  // Store cluster bounds
  window._clusterBounds = new Map();
  positions.forEach((pos, name) => {
    window._clusterBounds.set(name, {
      x: pos.x + offX, y: pos.y + offY,
      w: pos.rect.w, h: pos.rect.h,
    });
  });
}

layoutClusters();

function getClusterBounds(name) {
  return window._clusterBounds.get(name) || null;
}

// === DOM ===
const bgCanvas = document.getElementById('canvas-bg');
const clustersCanvas = document.getElementById('clusters-canvas');
const nodesLayer = document.getElementById('nodes-layer');
const bgCtx = bgCanvas.getContext('2d');
const clCtx = clustersCanvas.getContext('2d');

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth, h = window.innerHeight;
  bgCanvas.width = w * dpr; bgCanvas.height = h * dpr;
  bgCanvas.style.width = w + 'px'; bgCanvas.style.height = h + 'px';
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  clustersCanvas.width = w * dpr; clustersCanvas.height = h * dpr;
  clustersCanvas.style.width = w + 'px'; clustersCanvas.style.height = h + 'px';
  clCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}
window.addEventListener('resize', resize);

// Nodes (pointer-events: none — interaction handled by interaction layer)
const nodeEls = nodes.map(n => {
  const div = document.createElement('div');
  div.className = 'node';
  const desc = n.meta?.description || '';
  // Skip breadcrumb parts already shown as cluster/subcluster titles
  const bcFull = n.breadcrumbs || [];
  const skipLevels = n.orphan ? 0 : Math.min(bcFull.length, 3); // cluster(1) + sub(1) + sub2(1)
  const bcTail = bcFull.slice(skipLevels);
  // Also remove last crumb if it matches the page title
  if (bcTail.length > 0 && shortTitle(n.title).toLowerCase().startsWith(bcTail[bcTail.length - 1].toLowerCase())) bcTail.pop();
  const bc = bcTail.join(' > ');
  div.innerHTML =
    '<div class="node-card">' +
      (bc ? '<div class="node-bc">' + escHtml(bc) + '</div>' : '') +
      '<div class="node-title">' + escHtml(shortTitle(n.title)) + '</div>' +
      (desc ? '<div class="node-desc">' + escHtml(desc) + '</div>' : '') +
    '</div>';
  nodesLayer.appendChild(div);
  return div;
});

function shortTitle(t) {
  if (!t) return '?';
  return t.replace(/\\s*[—–|]\\s*Eesti Kunstiakadeemia.*$/i, '').trim() || t;
}

function updateNodeVisibility() {
  nodes.forEach((n, i) => {
    nodeEls[i].style.opacity = dimmedClusters.has(n.cluster) ? '0.05' : '1';
    nodeEls[i].style.pointerEvents = dimmedClusters.has(n.cluster) ? 'none' : 'auto';
  });
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// === Render ===
function render() {
  const w = window.innerWidth, h = window.innerHeight;
  const cx = w / 2, cy = h / 2;

  // Medium gray bg + dot grid
  bgCtx.clearRect(0, 0, w, h);
  bgCtx.fillStyle = '#c0c0c0';
  bgCtx.fillRect(0, 0, w, h);

  const dotSpacing = 24;
  const offsetX = ((panX * scale + cx) % (dotSpacing * scale) + dotSpacing * scale) % (dotSpacing * scale);
  const offsetY = ((panY * scale + cy) % (dotSpacing * scale) + dotSpacing * scale) % (dotSpacing * scale);
  const step = dotSpacing * scale;

  bgCtx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let x = offsetX; x < w; x += step) {
    for (let y = offsetY; y < h; y += step) {
      bgCtx.beginPath();
      bgCtx.arc(x, y, Math.max(0.4, scale * 0.5), 0, Math.PI * 2);
      bgCtx.fill();
    }
  }

  // Cluster regions
  clCtx.clearRect(0, 0, w, h);

  clusterNames.forEach(name => {
    if (dimmedClusters.has(name)) return;
    const bounds = getClusterBounds(name);
    if (!bounds) return;
    const style = getClusterStyle(name);

    const sx = (bounds.x + panX) * scale + cx;
    const sy = (bounds.y + panY) * scale + cy;

    // Cluster title — scales with zoom
    const titleSize = 20 * scale;
    if (titleSize < 2) return;
    clCtx.font = '700 ' + titleSize + 'px ITCFranklinGothic, sans-serif';
    clCtx.fillStyle = 'rgba(0,0,0,0.85)';
    clCtx.textAlign = 'left';
    clCtx.fillText(name, sx + 2 * scale, sy + titleSize + 2 * scale);
    // Count in normal weight, grayer
    const countX = clCtx.measureText(name).width + 6 * scale;
    clCtx.font = '400 ' + titleSize + 'px ITCFranklinGothic, sans-serif';
    clCtx.fillStyle = 'rgba(0,0,0,0.4)';
    clCtx.fillText(clusterGroups[name].nodes.length, sx + 2 * scale + countX, sy + titleSize + 2 * scale);
  });

  // Subcluster + sub-subcluster labels
  allLabelBounds.forEach(lb => {
    const sx = (lb.x + panX) * scale + cx;
    const sy = (lb.y + panY) * scale + cy;
    const size = (lb.level === 2 ? 8 : 5.5) * scale;
    if (size < 1.5) return;
    const alpha = lb.level === 2 ? 0.75 : 0.6;
    clCtx.font = '400 ' + size + 'px ITCFranklinGothic, sans-serif';
    clCtx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
    clCtx.textAlign = 'left';
    clCtx.fillText(lb.label, sx + 1.5 * scale, sy + size + 0.5 * scale);
    if (lb.count) {
      const labelW = clCtx.measureText(lb.label).width;
      clCtx.fillStyle = 'rgba(0,0,0,' + (alpha * 0.5) + ')';
      clCtx.font = '400 ' + size + 'px ITCFranklinGothic, sans-serif';
      clCtx.fillText(lb.count, sx + 1.5 * scale + labelW + 3 * scale, sy + size + 0.5 * scale);
    }
  });

  // Position nodes
  nodes.forEach((n, i) => {
    const el = nodeEls[i];
    const x = (n.x + panX) * scale + cx;
    const y = (n.y + panY) * scale + cy;
    el.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
    el.style.transformOrigin = '0 0';
  });
}

// === Hit testing ===
let hoveredIdx = -1;

function hitTest(clientX, clientY) {
  const w = window.innerWidth, h = window.innerHeight;
  const cx = w / 2, cy = h / 2;
  const wx = (clientX - cx) / scale - panX;
  const wy = (clientY - cy) / scale - panY;
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (wx >= n.x && wx <= n.x + NODE_W && wy >= n.y && wy <= n.y + NODE_H) return i;
  }
  return -1;
}

// === Interaction layer ===
const interLayer = document.getElementById('interaction-layer');

interLayer.addEventListener('mousedown', e => {
  isDragging = true;
  dragStartX = e.clientX; dragStartY = e.clientY;
  panStartX = panX; panStartY = panY;
  interLayer.classList.add('dragging');
});

interLayer.addEventListener('mousemove', e => {
  if (isDragging) {
    panX = panStartX + (e.clientX - dragStartX) / scale;
    panY = panStartY + (e.clientY - dragStartY) / scale;
    render();
    if (hoveredIdx >= 0) { nodeEls[hoveredIdx].classList.remove('hovered'); hoveredIdx = -1; }
    return;
  }
  // Hover hit test
  const idx = hitTest(e.clientX, e.clientY);
  if (idx !== hoveredIdx) {
    if (hoveredIdx >= 0) nodeEls[hoveredIdx].classList.remove('hovered');
    hoveredIdx = idx;
    if (idx >= 0) nodeEls[idx].classList.add('hovered');
  }
});

interLayer.addEventListener('mouseup', () => {
  isDragging = false;
  interLayer.classList.remove('dragging');
});

interLayer.addEventListener('mouseleave', () => {
  isDragging = false;
  interLayer.classList.remove('dragging');
  if (hoveredIdx >= 0) { nodeEls[hoveredIdx].classList.remove('hovered'); hoveredIdx = -1; }
});

// Doubleclick opens page
interLayer.addEventListener('dblclick', e => {
  const idx = hitTest(e.clientX, e.clientY);
  if (idx >= 0) {
    const n = nodes[idx];
    window.open(n.finalUrl || n.url, '_blank');
  }
});

// === Touch support ===
let lastTouchDist = 0;
let lastTouchMid = null;
let touchStartTime = 0;
let lastTapTime = 0;
let lastTapX = 0, lastTapY = 0;

interLayer.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    const t = e.touches[0];
    isDragging = true;
    dragStartX = t.clientX; dragStartY = t.clientY;
    panStartX = panX; panStartY = panY;
    interLayer.classList.add('dragging');
    touchStartTime = Date.now();
  } else if (e.touches.length === 2) {
    isDragging = false;
    interLayer.classList.remove('dragging');
    const t0 = e.touches[0], t1 = e.touches[1];
    lastTouchDist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    lastTouchMid = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
  }
}, { passive: false });

interLayer.addEventListener('touchmove', e => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    const t = e.touches[0];
    panX = panStartX + (t.clientX - dragStartX) / scale;
    panY = panStartY + (t.clientY - dragStartY) / scale;
    render();
    if (hoveredIdx >= 0) { nodeEls[hoveredIdx].classList.remove('hovered'); hoveredIdx = -1; }
  } else if (e.touches.length === 2) {
    const t0 = e.touches[0], t1 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
    const mid = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };

    if (lastTouchDist > 0) {
      const factor = dist / lastTouchDist;
      const newScale = Math.max(0.05, Math.min(5, scale * factor));
      const w = window.innerWidth, h = window.innerHeight;
      const cx = w / 2, cy = h / 2;
      const wx = (mid.x - cx) / scale - panX;
      const wy = (mid.y - cy) / scale - panY;
      scale = newScale;
      panX = (mid.x - cx) / scale - wx;
      panY = (mid.y - cy) / scale - wy;
      // Also pan with the midpoint movement
      panX += (mid.x - lastTouchMid.x) / scale;
      panY += (mid.y - lastTouchMid.y) / scale;
      render();
    }
    lastTouchDist = dist;
    lastTouchMid = mid;
  }
}, { passive: false });

interLayer.addEventListener('touchend', e => {
  e.preventDefault();
  if (e.touches.length === 0) {
    // Double-tap detection
    if (isDragging && Date.now() - touchStartTime < 300) {
      const ct = e.changedTouches[0];
      const now = Date.now();
      const dx = ct.clientX - lastTapX, dy = ct.clientY - lastTapY;
      if (now - lastTapTime < 400 && Math.hypot(dx, dy) < 30) {
        const idx = hitTest(ct.clientX, ct.clientY);
        if (idx >= 0) {
          const n = nodes[idx];
          window.open(n.finalUrl || n.url, '_blank');
        }
        lastTapTime = 0;
      } else {
        lastTapTime = now;
        lastTapX = ct.clientX;
        lastTapY = ct.clientY;
      }
    }
    isDragging = false;
    interLayer.classList.remove('dragging');
    lastTouchDist = 0;
    lastTouchMid = null;
  } else if (e.touches.length === 1) {
    // Went from 2 fingers to 1 — restart pan from current finger
    const t = e.touches[0];
    isDragging = true;
    dragStartX = t.clientX; dragStartY = t.clientY;
    panStartX = panX; panStartY = panY;
    lastTouchDist = 0;
    lastTouchMid = null;
  }
}, { passive: false });

// === Zoom (toward cursor) ===
interLayer.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  const newScale = Math.max(0.05, Math.min(5, scale * factor));
  const w = window.innerWidth, h = window.innerHeight;
  const cx = w / 2, cy = h / 2;
  const mx = e.clientX, my = e.clientY;
  const wx = (mx - cx) / scale - panX;
  const wy = (my - cy) / scale - panY;
  scale = newScale;
  panX = (mx - cx) / scale - wx;
  panY = (my - cy) / scale - wy;
  render();
}, { passive: false });

document.getElementById('btn-zoom-in').addEventListener('click', () => {
  scale = Math.min(5, scale * 1.3); render();
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
  scale = Math.max(0.05, scale / 1.3); render();
});
document.getElementById('btn-fit').addEventListener('click', () => {
  if (nodes.length === 0) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  clusterNames.forEach(name => {
    const b = getClusterBounds(name);
    if (!b) return;
    minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + b.w);
    minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y + b.h);
  });
  const pad = 40;
  const gw = maxX - minX + pad * 2, gh = maxY - minY + pad * 2;
  const sw = window.innerWidth * 0.95, sh = window.innerHeight * 0.95;
  scale = Math.min(sw / gw, sh / gh, 2);
  panX = -(minX + (maxX - minX) / 2);
  panY = -(minY + (maxY - minY) / 2);
  render();
});

resize();
document.getElementById('btn-fit').click();
</script>
</body>
</html>`;
}

// Run directly: node src/vis.js
import { argv } from 'process';
if (argv[1]?.endsWith('vis.js')) {
  import('fs').then(({ readFileSync, writeFileSync }) => {
    const sitemap = JSON.parse(readFileSync('docs/sitemap.json', 'utf8'));
    writeFileSync('docs/index.html', generateHtml(sitemap));
    console.log('Done');
  });
}

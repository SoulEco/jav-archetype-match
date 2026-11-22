/* 共用渲染层：A–F 页 + 雷达图 + 得分换算。index.html 与 share.html 共用 */
const DIM_HUES = ["#f472b6", "#c084fc", "#818cf8", "#fb7185", "#fbbf24", "#34d399"];
const ICONS = ["👁", "💃", "🎭", "⚡", "🌟", "💞"];
const DIM_FALLBACK = ["颜值", "身材", "演技", "崩坏反差", "公众形象", "陪伴感"];
const LEGACY_RE = [
  /颜值偏向[^，,。；;]*/, /身材风格偏向[^，,。；;]*/, /演技标签偏向[^，,。；;]*/,
  /反差感呈现为[^，,。；;]*/, /公众形象更接近[^，,。；;]*/, /陪伴氛围则是[^，,。；;]*/
];

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
function pct(raw, max) { return max > 0 ? Math.round(raw / max * 100) : 0; }
function dimName(i) { return (typeof dims !== "undefined" && dims[i] && dims[i].name) || DIM_FALLBACK[i]; }
function dimDesc(i) { return (typeof dims !== "undefined" && dims[i] && dims[i].desc) || ""; }
function genLabel(g) {
  const i = Number(String(g).replace("gen", "")) - 1;
  return (typeof genInfo !== "undefined" && genInfo[i] && genInfo[i].name) || String(g || "");
}
function toArr(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.keys(x).map(function (k) { return { gen: k, result: x[k] }; });
  return [];
}
function personScores(p) {
  const s = Array.isArray(p && p.scores) ? p.scores : [0, 0, 0, 0, 0, 0];
  const legacy = Math.max.apply(null, s.concat([0])) <= 10;
  const out = s.slice(0, 6).map(function (v) { return legacy ? v * 10 : v; });
  while (out.length < 6) out.push(0);
  return out;
}
function findPerson(gen, name) {
  if (!name || typeof people === "undefined") return null;
  const keys = (gen && people[gen]) ? [gen] : Object.keys(people);
  for (let k = 0; k < keys.length; k++) {
    const list = people[keys[k]] || [];
    for (let i = 0; i < list.length; i++) { if (list[i].name === name) return list[i]; }
  }
  return null;
}
function blankPerson(name) {
  return { name: name || "—", desc: "", summary: "", detail: "", aspects: {}, scores: [0, 0, 0, 0, 0, 0] };
}
function aspectOf(p, i) {
  if (!p) return "—";
  const nm = dimName(i);
  if (p.aspects && p.aspects[nm]) return String(p.aspects[nm]);
  const d = String(p.detail || "");
  let m = d.match(new RegExp("在\\s*" + nm + "\\s*维度[，,]\\s*你偏爱([^；;。，,]+)"));
  if (m) return m[1].trim();
  m = d.match(LEGACY_RE[i]);
  if (m) return m[0].replace(/^[\s\S]*?(偏向|呈现为|更接近|则是)/, "").trim();
  return "—";
}
function detailOf(p, i) {
  if (!p) return "";
  const d = String(p.detail || "");
  if (!d) return "";
  const nm = dimName(i);
  const stop = DIM_FALLBACK.join("|");
  const re = new RegExp("在\\s*" + nm + "\\s*维度[，,：:]?([\\s\\S]*?)(?=在\\s*(?:" + stop + ")\\s*维度|$)");
  const m = d.match(re);
  if (m && m[1] && m[1].trim()) return "在" + nm + "维度，" + m[1].trim();
  const m2 = d.match(LEGACY_RE[i]);
  if (m2) return m2[0] + "。";
  return d;
}
function normResult(rec) {
  const r = (rec && rec.result) ? rec.result : (rec || {});
  const gen = (rec && rec.gen) ? rec.gen : (r.gen || "");
  const sc = Array.isArray(r.scores) ? r.scores.slice(0, 6) : [];
  while (sc.length < 6) sc.push(0);
  const raw = Array.isArray(r.raw) ? r.raw.slice(0, 6) : null;
  const mx = Array.isArray(r.max) ? r.max.slice(0, 6) : null;
  const wName = (r.winner && typeof r.winner === "object") ? r.winner.name : String(r.winner || "");
  const wStored = (r.winner && typeof r.winner === "object") ? r.winner : null;
  const w = findPerson(gen, wName) || wStored || blankPerson(wName || "未知原型");
  const cn = Array.isArray(r.champions) ? r.champions.map(function (c) { return (c && typeof c === "object") ? c.name : String(c || ""); }) : [];
  const ch = [];
  for (let i = 0; i < 6; i++) {
    const stored = (Array.isArray(r.champions) && r.champions[i] && typeof r.champions[i] === "object") ? r.champions[i] : null;
    ch.push(findPerson(gen, cn[i]) || stored || blankPerson(cn[i]));
  }
  const rn = (r.runner && typeof r.runner === "object") ? r.runner : { name: r.runner ? String(r.runner) : "—", gap: null };
  return { gen: gen, sc: sc, raw: raw, mx: mx, w: w, ch: ch, rn: rn };
}
function scoreText(n, i) {
  if (n.raw && n.mx && n.mx[i] > 0) {
    return "实际得分 " + n.raw[i] + " ／ 满分 " + n.mx[i] + " × 100 ＝ <b>" + n.sc[i] + " 分</b>";
  }
  return "维度得分 <b>" + n.sc[i] + " 分</b>";
}
function sections(n, from, to) {
  let s = "";
  for (let i = from; i < to; i++) {
    s += '<div class="b-dim-section" style="--hue:' + DIM_HUES[i] + '">'
      + '<div class="b-dim-title"><span class="dim-ico">' + ICONS[i] + '</span>' + esc(dimName(i))
      + '<span class="dim-chip">' + n.sc[i] + '</span></div>'
      + '<div class="aspect-badge">' + esc(aspectOf(n.w, i)) + '</div>'
      + '<div class="b-dim-text">' + esc(detailOf(n.w, i)) + '</div>'
      + '<div class="dim-meta">' + esc(dimDesc(i)) + '</div>'
      + '<div class="dim-formula">' + scoreText(n, i) + '</div>'
      + '</div>';
  }
  return s;
}
function blocks(n, from, to) {
  let s = "";
  for (let i = from; i < to; i++) {
    const p = n.ch[i] || blankPerson("");
    s += '<div class="dim-block" style="--hue:' + DIM_HUES[i] + '">'
      + '<div class="dim-header-row"><span class="dim-name-score">' + ICONS[i] + ' ' + esc(dimName(i))
      + '<em>' + n.sc[i] + '分</em></span>'
      + '<span class="dim-champion">最像 · ' + esc(p.name) + '</span></div>'
      + '<div class="bar-container"><div class="bar-fill" style="width:' + n.sc[i] + '%"></div></div>'
      + '<div class="aspect-badge">' + esc(aspectOf(p, i)) + '</div>'
      + '<div class="dim-desc-text">' + esc(detailOf(p, i)) + '</div>'
      + '<div class="dim-formula">' + scoreText(n, i) + '</div>'
      + '</div>';
  }
  return s;
}
function buildPages(rec, times, includeF) {
  const n = normResult(rec), w = n.w;
  const label = genLabel(n.gen);
  const tag = '<div class="test-index-tag">第 ' + times + ' 次测试</div>';
  const t2 = (w.desc ? w.desc + " " : "") + w.name;
  let legend = "";
  for (let i = 0; i < 6; i++) {
    legend += '<span class="lg"><i style="background:' + DIM_HUES[i] + '"></i>' + esc(dimName(i)) + '<b>' + n.sc[i] + '</b></span>';
  }
  let h = "";
  h += '<section class="page-card saveable">' + tag + '<div class="card-body">'
    + '<div class="a-page-title">JAV ARCHETYPE ARCHIVE · ' + esc(label) + '</div>'
    + '<h2 class="a-page-name">' + esc(w.name) + '</h2>'
    + '<div class="a-page-desc">' + esc(w.desc || "") + '</div>'
    + '<div class="radar-box"><h4>✨ 你的本命气质魂 ✨</h4>'
    + '<canvas id="radarCanvas" width="440" height="440"></canvas>'
    + '<div class="radar-legend">' + legend + '</div></div>'
    + '<div class="a-page-summary">' + esc(w.summary || w.detail || "") + '</div>'
    + '</div></section>';

  h += '<section class="page-card saveable">' + tag + '<div class="card-body">'
    + '<div class="b-page-desc-large">' + esc(t2) + '</div>'
    + '<div class="b-page-dimensions-list">' + sections(n, 0, 3) + '</div>'
    + '<div class="b-page-name-small">—— 匹配原型 · ' + esc(w.name) + ' ——</div>'
    + '</div></section>';

  h += '<section class="page-card saveable">' + tag + '<div class="card-body">'
    + '<div class="c-page-desc-medium">' + esc(t2) + '</div>'
    + '<div class="b-page-dimensions-list">' + sections(n, 3, 6) + '</div>'
    + '<div class="b-page-name-small">—— 匹配原型 · ' + esc(w.name) + ' ——</div>'
    + '</div></section>';

  h += '<section class="page-card saveable">' + tag + '<div class="card-body">'
    + '<div class="c-page-title">🧬 六维深度解析 · 上</div>'
    + '<div class="dim-scroll">' + blocks(n, 0, 3) + '</div>'
    + '</div></section>';

  h += '<section class="page-card saveable">' + tag + '<div class="card-body">'
    + '<div class="c-page-title">🧬 六维深度解析 · 下</div>'
    + '<div class="dim-scroll">' + blocks(n, 3, 6) + '</div>'
    + '<p class="note">第二接近原型：<b>' + esc(n.rn.name) + '</b>'
    + ((n.rn.gap !== null && n.rn.gap !== undefined) ? '（距离差 ' + esc(n.rn.gap) + '）' : '')
    + '。结果为娱乐性风格类比，不代表真人性格或私生活。</p>'
    + '</div></section>';

  if (includeF) {
    h += '<section class="page-card page-f"><div class="card-body f-body">'
      + '<div class="c-page-title">📤 保存与分享</div>'
      + '<div class="f-actions">'
      + '<button class="btn-save-poster" onclick="saveAllPosters(this)">📸 保存当前图片</button>'
      + '<button class="btn-share-link" onclick="shareResult()">🔗 分享测试结果</button>'
      + '<button class="btn-retest" onclick="backToTest()">🔄 返回再次测试</button>'
      + '<a class="btn-more" href="https://allshop-djt.pages.dev/">🛒 更多测试</a>'
      + '<p class="f-tip">保存：A–E 共 5 张海报分别存到本地<br>分享：生成文案复制链接发给朋友</p>'
      + '</div></div></section>';
  }
  return h;
}
function paintRadar(rec) {
  const cv = document.getElementById("radarCanvas");
  if (!cv) return;
  const n = normResult(rec), sc = n.sc, ch = n.ch;
  const S = 440, dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = S * dpr; cv.height = S * dpr;
  cv.style.width = "100%"; cv.style.maxWidth = S + "px"; cv.style.height = "auto";
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, S, S);
  const cx = S / 2, cy = S / 2, R = 120, OFF = 155, MAX = 100;
  for (let lv = 1; lv <= 5; lv++) {
    const r = R / 5 * lv;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 2 / 6 * i - Math.PI / 2;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = lv === 5 ? "rgba(192,132,252,.42)" : "rgba(140,110,190,.20)";
    ctx.lineWidth = 1; ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 2 / 6 * i - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = "rgba(140,110,190,.26)"; ctx.stroke();
  }
  const pts = [];
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 2 / 6 * i - Math.PI / 2, r = Math.max(0, Math.min(100, sc[i])) / MAX * R;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    pts.push({ x: x, y: y, a: a });
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  g.addColorStop(0, "rgba(124,58,237,.46)");
  g.addColorStop(0.5, "rgba(219,39,119,.34)");
  g.addColorStop(1, "rgba(99,102,241,.42)");
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "#c084fc"; ctx.lineWidth = 2; ctx.stroke();
  ctx.textBaseline = "middle";
  for (let i = 0; i < 6; i++) {
    const p = pts[i], cos = Math.cos(p.a);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = DIM_HUES[i]; ctx.fill();
    ctx.strokeStyle = "rgba(10,7,16,.85)"; ctx.lineWidth = 1.5; ctx.stroke();
    const tx = cx + OFF * cos, ty = cy + OFF * Math.sin(p.a);
    ctx.textAlign = Math.abs(cos) < 0.2 ? "center" : (cos > 0 ? "left" : "right");
    let nm = (ch[i] && ch[i].name) ? String(ch[i].name).replace(/（[^）]*）/g, "") : "";
    const top = (i === 0 || i === 1 || i === 5);
    if (top) {
      ctx.font = "bold 14px -apple-system,sans-serif"; ctx.fillStyle = "#f4f0fa"; ctx.fillText(nm, tx, ty - 28);
      ctx.font = "bold 12px -apple-system,sans-serif"; ctx.fillStyle = DIM_HUES[i]; ctx.fillText(dimName(i), tx, ty - 10);
      ctx.font = "11px -apple-system,sans-serif"; ctx.fillStyle = "#9b90b0"; ctx.fillText(sc[i] + "分", tx, ty + 8);
    } else {
      ctx.font = "11px -apple-system,sans-serif"; ctx.fillStyle = "#9b90b0"; ctx.fillText(sc[i] + "分", tx, ty - 8);
      ctx.font = "bold 12px -apple-system,sans-serif"; ctx.fillStyle = DIM_HUES[i]; ctx.fillText(dimName(i), tx, ty + 10);
      ctx.font = "bold 14px -apple-system,sans-serif"; ctx.fillStyle = "#f4f0fa"; ctx.fillText(nm, tx, ty + 28);
    }
  }
}
const ICONS = ["👁", "💃", "🎭", "⚡", "🌟", "💞"];
const CLAUSE = [
  /颜值偏向[^，,。；;]*/,
  /身材风格偏向[^，,。；;]*/,
  /演技标签偏向[^，,。；;]*/,
  /反差感呈现为[^，,。；;]*/,
  /公众形象更接近[^，,。；;]*/,
  /陪伴氛围则是[^，,。；;]*/
];

function pct(raw, max) { return max > 0 ? Math.round(raw / max * 100) : 0; }

function genLabel(g) {
  const i = Number(String(g).replace("gen", "")) - 1;
  return (typeof genInfo !== "undefined" && genInfo[i] && genInfo[i].name) || String(g || "");
}

function findPerson(gen, name) {
  if (!name || typeof people === "undefined") return null;
  const list = people[gen] || [];
  for (let i = 0; i < list.length; i++) { if (list[i].name === name) return list[i]; }
  return null;
}

function blank(name) {
  return { name: name || "—", desc: "", summary: "", detail: "", aspects: {} };
}

function normResult(rec) {
  const r = (rec && rec.result) ? rec.result : (rec || {});
  const gen = (rec && rec.gen) ? rec.gen : (r.gen || "");
  const sc = Array.isArray(r.scores) ? r.scores.slice(0, 6) : [0, 0, 0, 0, 0, 0];
  const raw = Array.isArray(r.raw) ? r.raw.slice(0, 6) : null;
  const mx = Array.isArray(r.max) ? r.max.slice(0, 6) : null;
  const wName = (r.winner && typeof r.winner === "object") ? r.winner.name : String(r.winner || "");
  const w = findPerson(gen, wName) || ((r.winner && typeof r.winner === "object") ? r.winner : blank(wName || "未知原型"));
  const cn = Array.isArray(r.champions) ? r.champions.map(function (c) { return (c && typeof c === "object") ? c.name : String(c || ""); }) : [];
  const ch = [];
  for (let i = 0; i < 6; i++) {
    ch.push(findPerson(gen, cn[i]) || ((cn[i] && r.champions[i] && typeof r.champions[i] === "object") ? r.champions[i] : blank(cn[i])));
  }
  const rn = (r.runner && typeof r.runner === "object") ? r.runner : { name: r.runner ? String(r.runner) : "—", gap: null };
  return { gen: gen, sc: sc, raw: raw, mx: mx, w: w, ch: ch, rn: rn };
}

function aspectOf(p, i) {
  if (!p) return "—";
  const nm = dims[i].name;
  if (p.aspects && p.aspects[nm]) return p.aspects[nm];
  const m = String(p.detail || "").match(CLAUSE[i]);
  if (m) return m[0].replace(/^[^偏呈更则]*?(偏向|呈现为|更接近|则是)/, "");
  return "—";
}

function clauseOf(p, i) {
  if (!p) return "";
  const m = String(p.detail || "").match(CLAUSE[i]);
  if (m) return m[0];
  const a = aspectOf(p, i);
  return a === "—" ? "" : (dims[i].name + "：" + a);
}

function scoreLine(n, i) {
  if (n.raw && n.mx) return "得分 " + n.sc[i] + " 分（" + n.raw[i] + " / " + n.mx[i] + " × 100）";
  return "得分 " + n.sc[i] + " 分";
}

function sections(n, from, to) {
  let s = "";
  for (let i = from; i < to; i++) {
    const a = aspectOf(n.w, i), c = clauseOf(n.w, i);
    s += '<div class="b-dim-section">'
      + '<div class="b-dim-title">' + ICONS[i] + ' ' + dims[i].name + '</div>'
      + '<div class="b-dim-text"><b style="color:#d8b4fe">' + a + '</b><br>'
      + (c ? c + '。' : '') + dims[i].desc + '<br>'
      + '<span style="color:#888">' + scoreLine(n, i) + '</span></div></div>';
  }
  return s;
}

function blocks(n, from, to) {
  let s = "";
  for (let i = from; i < to; i++) {
    const p = n.ch[i] || blank("");
    const a = aspectOf(p, i), c = clauseOf(p, i);
    s += '<div class="dim-block">'
      + '<div class="dim-header-row"><span class="dim-name-score">' + dims[i].name + '（' + n.sc[i] + '分）</span>'
      + '<span class="dim-champion">最像：' + p.name + '</span></div>'
      + '<div class="bar-container"><div class="bar-fill" style="width:' + n.sc[i] + '%"></div></div>'
      + '<div class="dim-desc-text"><b style="color:#d8b4fe">' + a + '</b>｜' + (c ? c + '。' : '') + dims[i].desc + '</div>'
      + '<div class="dim-desc-text">' + scoreLine(n, i) + '</div>'
      + '</div>';
  }
  return s;
}

function buildPages(rec, times, includeF) {
  const n = normResult(rec);
  const w = n.w;
  const label = genLabel(n.gen);
  const tag = '<div class="test-index-tag">第 ' + times + ' 次测试</div>';
  const t2 = (w.desc ? w.desc + " " : "") + w.name;
  let h = "";

  h += '<div class="page-card saveable">' + tag
    + '<div class="a-page-title">JAV ARCHETYPE ARCHIVE · ' + label + '</div>'
    + '<h2 class="a-page-name">' + w.name + '</h2>'
    + '<div class="a-page-desc">' + (w.desc || "") + '</div>'
    + '<div class="radar-box"><h4>✨ 你的本命气质魂 ✨</h4><canvas id="radarCanvas" width="400" height="400"></canvas></div>'
    + '<div class="a-page-summary">' + (w.summary || w.detail || "") + '</div></div>';

  h += '<div class="page-card saveable">' + tag
    + '<div class="b-page-desc-large">' + t2 + '</div>'
    + '<div class="b-page-dimensions-list">' + sections(n, 0, 3) + '</div>'
    + '<div class="b-page-name-small">—— 匹配原型 ——</div></div>';

  h += '<div class="page-card saveable">' + tag
    + '<div class="c-page-desc-medium">' + t2 + '</div>'
    + '<div class="b-page-dimensions-list">' + sections(n, 3, 6) + '</div>'
    + '<div class="b-page-name-small">—— 匹配原型 ——</div></div>';

  h += '<div class="page-card saveable">' + tag
    + '<div class="c-page-title">🧬 六维深度解析</div>' + blocks(n, 0, 3) + '</div>';

  h += '<div class="page-card saveable">' + tag
    + '<div class="c-page-title">🧬 六维深度解析</div>' + blocks(n, 3, 6)
    + '<div class="dim-desc-text" style="margin-top:18px">' + (w.detail || "") + '</div>'
    + '<p class="note">第二接近原型：' + n.rn.name
    + ((n.rn.gap !== null && n.rn.gap !== undefined) ? '（距离差 ' + n.rn.gap + '）' : '')
    + '。结果仅供娱乐参考。</p></div>';

  if (includeF) {
    h += '<div class="page-card page-f">'
      + '<div class="c-page-title">📤 保存与分享</div>'
      + '<div class="f-actions">'
      + '<button class="btn-save-poster" onclick="saveAllPosters(this)">📸 保存当前图片</button>'
      + '<button class="btn-share-link" onclick="shareResult()">🔗 分享测试结果</button>'
      + '<button class="btn-retest" onclick="backToTest()">🔄 返回再次测试</button>'
      + '<a class="btn-more" href="https://allshop-djt.pages.dev/">🛒 更多测试</a>'
      + '<p class="f-tip">保存：A–E 共 5 张海报分别存到本地<br>分享：生成文案复制链接发给朋友</p>'
      + '</div></div>';
  }
  return h;
}

function paintRadar(rec) {
  const cv = document.getElementById("radarCanvas");
  if (!cv) return;
  const n = normResult(rec), sc = n.sc, ch = n.ch;
  const ctx = cv.getContext("2d"), W = 400, H = 400;
  cv.width = W; cv.height = H;
  const cx = W / 2, cy = H / 2, R = 130, MAX = 100;
  ctx.clearRect(0, 0, W, H);
  for (let lv = 1; lv <= 5; lv++) {
    const r = R / 5 * lv;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 2 / 6 * i - Math.PI / 2;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 2 / 6 * i - Math.PI / 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = "#444"; ctx.stroke();
  }
  const pts = [];
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI * 2 / 6 * i - Math.PI / 2, r = sc[i] / MAX * R;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    pts.push({ x: x, y: y, a: a });
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath(); ctx.fillStyle = "rgba(147,51,234,0.32)"; ctx.fill();
  ctx.strokeStyle = "#9333ea"; ctx.lineWidth = 2; ctx.stroke();
  ctx.textBaseline = "middle";
  for (let i = 0; i < 6; i++) {
    const p = pts[i];
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = "#c084fc"; ctx.fill();
    const cos = Math.cos(p.a);
    ctx.textAlign = (Math.abs(cos) < 0.2) ? "center" : (cos > 0 ? "right" : "left");
    const off = 165, tx = cx + off * cos, ty = cy + off * Math.sin(p.a);
    let nm = (ch[i] && ch[i].name) ? String(ch[i].name) : "";
    if (nm.length > 6) nm = nm.slice(0, 6);
    if (i === 0 || i === 1 || i === 5) {
      ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(nm, tx, ty - 30);
      ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#c084fc"; ctx.fillText(dims[i].name, tx, ty - 12);
      ctx.font = "12px sans-serif"; ctx.fillStyle = "#888"; ctx.fillText(sc[i] + "分", tx, ty + 6);
    } else {
      ctx.font = "12px sans-serif"; ctx.fillStyle = "#888"; ctx.fillText(sc[i] + "分", tx, ty - 6);
      ctx.font = "bold 13px sans-serif"; ctx.fillStyle = "#c084fc"; ctx.fillText(dims[i].name, tx, ty + 12);
      ctx.font = "bold 15px sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText(nm, tx, ty + 30);
    }
  }
}

function toArr(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object") return Object.keys(x).map(function (k) { return { gen: k, result: x[k] }; });
  return [];
}
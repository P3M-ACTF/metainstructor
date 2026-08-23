let analysis = null;
let glossary = [];

const $ = (id) => document.getElementById(id);
const status = (m) => { $("status").textContent = m || ""; };

document.querySelectorAll("nav button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    $(b.dataset.tab).classList.add("active");
  });
});

$("drop").addEventListener("click", () => $("file").click());
$("drop").addEventListener("dragover", (e) => { e.preventDefault(); });
$("drop").addEventListener("drop", (e) => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]);
});
$("file").addEventListener("change", (e) => {
  if (e.target.files[0]) upload(e.target.files[0]);
});
$("fetch").addEventListener("click", async () => {
  const url = $("url").value.trim();
  if (!url) return;
  status("Fetch…");
  try {
    const r = await fetch("/api/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || r.statusText);
    show(j);
  } catch (err) { status(String(err)); }
});
$("analyze-html").addEventListener("click", () => text("html"));
$("analyze-json").addEventListener("click", () => text("json"));
$("search").addEventListener("input", renderFields);
$("export-json").addEventListener("click", () => download("metapeek.json", JSON.stringify(analysis, null, 2)));
$("export-csv").addEventListener("click", () => download("metapeek.csv", toCsv(analysis)));
$("export-md").addEventListener("click", () => download("metapeek.md", toMd(analysis)));

async function text(kind) {
  const value = $("paste").value;
  if (!value.trim()) return;
  status("Analizando…");
  const r = await fetch("/api/analyze-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: value, kind }),
  });
  const j = await r.json();
  if (!r.ok) { status(j.error || "error"); return; }
  show(j);
}

async function upload(file) {
  const fd = new FormData();
  fd.append("file", file, file.name);
  status("Analizando " + file.name + "…");
  const r = await fetch("/api/analyze", { method: "POST", body: fd });
  const j = await r.json();
  if (!r.ok) { status(j.error || "error"); return; }
  show(j);
}

function show(a) {
  analysis = a;
  const n = (a.sections || []).reduce((s, x) => s + (x.fields || []).length, 0);
  status((a.filename || a.mime) + " · " + n + " campos · " + a.size + " bytes");
  renderSummary();
  renderFields();
  renderMap();
  renderTimeline();
}

function allFields() {
  const out = [];
  for (const s of analysis?.sections || []) {
    for (const f of s.fields || []) out.push({ section: s, field: f });
  }
  return out;
}

function renderSummary() {
  if (!analysis) return;
  const gps = findGps();
  const dates = collectDates();
  const software = first(["Software", "CreatorTool", "Producer", "Application", "WritingApp"]);
  const device = [first(["Make"]), first(["Model"])].filter(Boolean).join(" ");
  const bars = composition();
  $("summary").innerHTML = `
    <article class="section">
      <h3>Historia del archivo</h3>
      <p class="story">Es un <strong>${esc(analysis.mime)}</strong>
      ${analysis.filename ? "llamado <strong>" + esc(analysis.filename) + "</strong>" : ""}
      de ${analysis.size} bytes.
      ${device ? "Dispositivo: <strong>" + esc(device) + "</strong>. " : ""}
      ${software ? "Escrito/editado con <strong>" + esc(software) + "</strong>. " : ""}
      ${gps ? "Ubicación: <strong>" + gps.lat.toFixed(5) + ", " + gps.lon.toFixed(5) + "</strong>. " : "Sin GPS. "}
      Fechas observadas: ${dates.length}.</p>
      <p>SHA-256 <code>${esc(analysis.hashes.sha256)}</code></p>
      <p>Entropía ${analysis.entropy.toFixed(3)} bits/byte</p>
      <div class="bars">${bars.map(b => `<span style="width:${b.pct}%;background:${b.color}" title="${esc(b.label)}"></span>`).join("")}</div>
      <p class="story">${bars.map(b => b.label + " " + b.count).join(" · ")}</p>
    </article>
    ${(analysis.warnings || []).map(w => `<p class="warn">⚠ ${esc(w)}</p>`).join("")}
    ${(analysis.notes_educativas || []).map(n => `<p class="story">${esc(n)}</p>`).join("")}
  `;
}

function composition() {
  const colors = ["#7dd3fc", "#c4b5fd", "#86efac", "#fca5a5", "#fde68a", "#fda4af"];
  const groups = {};
  for (const { section, field } of allFields()) {
    const ns = (field.namespace || section.id || "other").split(":")[0];
    groups[ns] = (groups[ns] || 0) + 1;
  }
  const total = Object.values(groups).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(groups).map(([label, count], i) => ({
    label, count, pct: (count / total) * 100, color: colors[i % colors.length],
  }));
}

function renderFields() {
  if (!analysis) return;
  const q = ($("search").value || "").toLowerCase();
  let html = "";
  for (const s of analysis.sections || []) {
    const fields = (s.fields || []).filter((f) => {
      if (!q) return true;
      return [f.key, f.label, f.value, f.namespace, s.label].join(" ").toLowerCase().includes(q);
    });
    if (!fields.length) continue;
    html += `<article class="section"><h3>${esc(s.label)} <small>(${fields.length})</small></h3>`;
    for (const f of fields) {
      html += `<div class="field" data-key="${esc(f.key)}"><div class="k">${esc(f.key)}</div><div class="v">${esc(f.value)}</div></div>`;
    }
    html += `</article>`;
  }
  $("fields").innerHTML = html || "<p>Sin campos</p>";
  $("fields").querySelectorAll(".field").forEach((el) => {
    el.addEventListener("click", () => explain(el.dataset.key));
  });
}

function explain(key) {
  const hit = allFields().find((x) => x.field.key === key);
  const f = hit?.field;
  let body = `<p><strong>${esc(key)}</strong></p>`;
  if (f?.explanation) body += `<pre style="white-space:pre-wrap">${esc(f.explanation)}</pre>`;
  const g = glossary.find((e) => (e.keys || []).some((k) => k.toLowerCase() === key.toLowerCase()));
  if (g) body += `<p><strong>${esc(g.title_es)}</strong></p><p>${esc(g.body_es)}</p><p>${esc(g.body_en)}</p>`;
  if (!f?.explanation && !g) body += `<p class="story">Sin entrada de glosario. El valor se muestra igual: no se oculta.</p>`;
  $("explain-body").innerHTML = body;
}

function findGps() {
  const fields = allFields().map((x) => x.field);
  const latF = fields.find((f) => /latitude/i.test(f.key) && !/ref/i.test(f.key));
  const lonF = fields.find((f) => /longitude/i.test(f.key) && !/ref/i.test(f.key));
  if (!latF || !lonF) return null;
  const lat = parseCoord(latF.value, fields.find((f) => /LatitudeRef/i.test(f.key))?.value);
  const lon = parseCoord(lonF.value, fields.find((f) => /LongitudeRef/i.test(f.key))?.value);
  if (lat == null || lon == null) return null;
  return { lat, lon };
}

function parseCoord(value, ref) {
  const paren = value.match(/\((-?\d+\.?\d*)\)/);
  let n = paren ? parseFloat(paren[1]) : parseFloat(value);
  if (Number.isNaN(n)) {
    const nums = [...value.matchAll(/(\d+\.?\d*)/g)].map((m) => parseFloat(m[1]));
    if (nums.length >= 3) n = nums[0] + nums[1] / 60 + nums[2] / 3600;
    else if (nums.length === 1) n = nums[0];
    else return null;
  }
  if (ref && (ref.startsWith("S") || ref.startsWith("W"))) n = -Math.abs(n);
  return n;
}

function renderMap() {
  const gps = analysis && findGps();
  if (!gps) {
    $("map").innerHTML = "<p class='story'>No hay coordenadas GPS en este archivo.</p>";
    return;
  }
  const delta = 0.01;
  const bbox = [gps.lon - delta, gps.lat - delta, gps.lon + delta, gps.lat + delta].join(",");
  $("map").innerHTML = `
    <p>${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}</p>
    <iframe title="map" style="width:100%;height:360px;border:0;border-radius:10px"
      src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${gps.lat}%2C${gps.lon}"></iframe>
    <p><a href="https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=16/${gps.lat}/${gps.lon}" target="_blank" rel="noreferrer">Abrir en OpenStreetMap</a></p>
  `;
}

function collectDates() {
  const re = /(date|time|created|modified|timestamp|mtime|ctime)/i;
  const out = [];
  for (const { section, field } of allFields()) {
    if (re.test(field.key) || re.test(field.label)) {
      out.push({ when: field.value, label: field.key, source: section.label });
    }
  }
  return out;
}

function renderTimeline() {
  const dates = collectDates();
  $("timeline").innerHTML = dates.length
    ? dates.map((d) => `<div class="field"><div class="k">${esc(d.source)}</div><div class="v"><strong>${esc(d.label)}</strong> ${esc(d.when)}</div></div>`).join("")
    : "<p class='story'>Sin fechas detectadas.</p>";
}

function first(keys) {
  for (const k of keys) {
    const hit = allFields().find((x) => x.field.key.toLowerCase() === k.toLowerCase());
    if (hit) return hit.field.value;
  }
  return "";
}

function toCsv(a) {
  if (!a) return "";
  let s = "section,key,value,namespace\n";
  for (const { section, field } of allFields()) {
    s += [section.label, field.key, field.value, field.namespace || ""].map(csv).join(",") + "\n";
  }
  return s;
}
function csv(v) {
  v = String(v ?? "");
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function toMd(a) {
  if (!a) return "";
  let md = `# ${a.filename || "MetaPeek"}\n\n`;
  for (const sec of a.sections || []) {
    md += `## ${sec.label}\n\n`;
    for (const f of sec.fields || []) md += `- **${f.key}**: ${f.value}\n`;
    md += "\n";
  }
  return md;
}
function download(name, text) {
  if (!text) return;
  const blob = new Blob([text], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

fetch("/api/glossary").then((r) => r.json()).then((j) => { glossary = j; }).catch(() => {});

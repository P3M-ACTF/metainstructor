let analysis = null;
let glossary = [];
let activeKey = "";

const $ = (id) => document.getElementById(id);
const status = (m) => { $("status").textContent = m || ""; };
const query = () => ($("search").value || "").toLowerCase().trim();

const tabs = [...document.querySelectorAll("nav [role=tab]")];
function activateTab(btn) {
  tabs.forEach((x) => {
    const on = x === btn;
    x.classList.toggle("active", on);
    x.setAttribute("aria-selected", on ? "true" : "false");
    x.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll(".panel").forEach((p) => {
    const on = p.id === btn.dataset.tab;
    p.classList.toggle("active", on);
    p.hidden = !on;
  });
  btn.focus();
}
tabs.forEach((b) => {
  b.tabIndex = b.classList.contains("active") ? 0 : -1;
  b.addEventListener("click", () => activateTab(b));
  b.addEventListener("keydown", (e) => {
    const i = tabs.indexOf(b);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      activateTab(tabs[(i + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      activateTab(tabs[(i - 1 + tabs.length) % tabs.length]);
    } else if (e.key === "Home") {
      e.preventDefault();
      activateTab(tabs[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      activateTab(tabs[tabs.length - 1]);
    }
  });
});

const drop = $("drop");
drop.addEventListener("click", () => $("file").click());
drop.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    $("file").click();
  }
});
$("file").addEventListener("click", (e) => e.stopPropagation());
drop.addEventListener("dragover", (e) => {
  e.preventDefault();
  drop.classList.add("dragover");
});
drop.addEventListener("dragleave", () => drop.classList.remove("dragover"));
drop.addEventListener("drop", (e) => {
  e.preventDefault();
  drop.classList.remove("dragover");
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
$("search").addEventListener("input", onSearch);
$("export-json").addEventListener("click", () => download("metapeek.json", JSON.stringify(analysis, null, 2)));
$("export-csv").addEventListener("click", () => download("metapeek.csv", toCsv(analysis)));
$("export-md").addEventListener("click", () => download("metapeek.md", toMd(analysis)));

document.addEventListener("click", (e) => {
  const copyBtn = e.target.closest("[data-copy]");
  if (copyBtn) {
    e.preventDefault();
    copyText(copyBtn.getAttribute("data-copy"), copyBtn.getAttribute("data-label"));
    return;
  }
  const row = e.target.closest("[data-key]");
  if (row && $("fields").contains(row)) explain(row.getAttribute("data-key"));
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const row = e.target.closest("tr[data-key]");
  if (row && $("fields").contains(row)) {
    e.preventDefault();
    explain(row.getAttribute("data-key"));
  }
});

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
  status((a.filename || a.mime) + " · " + n + " campos · " + formatBytes(a.size));
  $("file-bar").hidden = false;
  $("search-wrap").hidden = false;
  $("file-name").textContent = a.filename || a.mime || "análisis";
  renderChips();
  renderSummary();
  renderFields();
  renderMap(false);
  renderTimeline();
}

function onSearch() {
  if (!analysis) return;
  renderFields();
  renderTimeline();
}

function allFields() {
  const out = [];
  for (const s of analysis?.sections || []) {
    for (const f of s.fields || []) out.push({ section: s, field: f });
  }
  return out;
}

function matchesQuery(parts, q) {
  if (!q) return true;
  return parts.join(" ").toLowerCase().includes(q);
}

function renderChips() {
  const a = analysis;
  const sha = a.hashes?.sha256 || "";
  const shaShort = sha.length > 16 ? sha.slice(0, 16) + "…" : sha;
  $("chips").innerHTML = [
    chip("MIME", a.mime, a.mime),
    chip("Tamaño", formatBytes(a.size), String(a.size)),
    sha ? chip("SHA-256", shaShort, sha) : "",
  ].join("");
}

function chip(label, value, copyValue) {
  return `<button type="button" class="chip" data-copy="${escAttr(copyValue || value)}" data-label="${escAttr(label)}" title="Copiar ${esc(label)}">
    <span class="chip-k">${esc(label)}</span>
    <span class="chip-v">${esc(value)}</span>
  </button>`;
}

function renderSummary() {
  if (!analysis) return;
  const gps = findGps();
  const dates = collectDates();
  const software = first(["Software", "CreatorTool", "Producer", "Application", "WritingApp"]);
  const device = [first(["Make"]), first(["Model"])].filter(Boolean).join(" ");
  const bars = composition();
  const magic = analysis.magic || {};
  const hashes = analysis.hashes || {};
  const hashRows = [
    ["SHA-256", hashes.sha256],
    ["SHA-1", hashes.sha1],
    ["MD5", hashes.md5],
    ["BLAKE3", hashes.blake3],
    ["SHA-512", hashes.sha512],
  ].filter(([, v]) => v);
  $("summary").innerHTML = `
    <article class="section">
      <h3>Ficha del archivo</h3>
      <p class="story" style="margin:0">${esc(analysis.filename || "sin nombre")}
        ${analysis.extracted_at ? " · extraído " + esc(analysis.extracted_at) : ""}</p>
      <p class="story">${esc(magic.description || analysis.mime)}
        ${magic.extension ? " · ." + esc(magic.extension) : ""}
        ${magic.hex_signature ? ` · <span class="mono">${esc(magic.hex_signature)}</span>` : ""}</p>
      <dl class="hash-list">
        ${hashRows.map(([k, v]) => `<div class="hash-row">
          <dt>${esc(k)}</dt>
          <dd><button type="button" class="chip" data-copy="${escAttr(v)}" data-label="${escAttr(k)}" title="Copiar ${esc(k)}">
            <span class="chip-v hash">${esc(v)}</span>
          </button></dd>
        </div>`).join("")}
      </dl>
      <p class="story-short story">
        ${device ? "Dispositivo <strong>" + esc(device) + "</strong>. " : ""}
        ${software ? "Escrito/editado con <strong>" + esc(software) + "</strong>. " : ""}
        ${gps ? "GPS " + gps.lat.toFixed(5) + ", " + gps.lon.toFixed(5) + ". " : "Sin GPS. "}
        ${dates.length} fecha${dates.length === 1 ? "" : "s"} en el timeline.
      </p>
      <p class="story">Entropía ${Number(analysis.entropy || 0).toFixed(3)} bits/byte</p>
      <div class="bars">${bars.map((b) => `<span style="width:${b.pct}%;background:${b.color}" title="${esc(b.label)}"></span>`).join("")}</div>
      <p class="story">${bars.map((b) => b.label + " " + b.count).join(" · ") || "Sin campos"}</p>
    </article>
    ${(analysis.warnings || []).map((w) => `<p class="warn">⚠ ${esc(w)}</p>`).join("")}
    ${(analysis.notes_educativas || []).map((n) => `<p class="story">${esc(n)}</p>`).join("")}
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
  const q = query();
  const total = allFields().length;
  let shown = 0;
  let html = "";
  for (const s of analysis.sections || []) {
    const fields = (s.fields || []).filter((f) =>
      matchesQuery([f.key, f.label, f.value, f.namespace, s.label], q)
    );
    if (!fields.length) continue;
    shown += fields.length;
    html += `<details class="section" open>
      <summary><h3>${esc(s.label)}</h3><span class="count">${fields.length}</span></summary>
      <table class="fields">
        <thead><tr><th>Clave</th><th>Valor</th><th>Namespace</th></tr></thead>
        <tbody>
          ${fields.map((f) => fieldRow(f)).join("")}
        </tbody>
      </table>
    </details>`;
  }
  const meta = q
    ? `<p class="filter-meta">${shown} coincidencia${shown === 1 ? "" : "s"} de ${total}</p>`
    : "";
  $("fields").innerHTML = html
    ? meta + html
    : `<p class="empty">${q ? "Ningún campo coincide con «" + esc(q) + "»." : "Sin campos"}</p>`;
  markActiveRow();
}

function fieldRow(f) {
  const title = spanTitle(f);
  const active = f.key === activeKey ? " is-active" : "";
  return `<tr class="field-row${active}" tabindex="0" data-key="${escAttr(f.key)}" ${title ? `title="${escAttr(title)}"` : ""}>
    <td class="k">${esc(f.key)}</td>
    <td class="v">${esc(f.value)}</td>
    <td class="ns">${esc(f.namespace || "")}</td>
  </tr>`;
}

function spanTitle(f) {
  if (f.offset == null && f.length == null) return "";
  const parts = [];
  if (f.offset != null) {
    parts.push("offset 0x" + Number(f.offset).toString(16).toUpperCase() + " (" + f.offset + ")");
  }
  if (f.length != null) parts.push(f.length + " bytes");
  return parts.join(" · ");
}

function explain(key) {
  activeKey = key;
  markActiveRow();
  const hit = allFields().find((x) => x.field.key === key);
  const f = hit?.field;
  let body = `<p><strong>${esc(key)}</strong></p>`;
  if (f?.namespace) body += `<p class="story ns">${esc(f.namespace)}</p>`;
  if (f && (f.offset != null || f.length != null)) {
    body += `<p class="story offset">${esc(spanTitle(f))}</p>`;
  }
  if (f?.explanation) body += `<pre style="white-space:pre-wrap">${esc(f.explanation)}</pre>`;
  const g = glossary.find((e) => (e.keys || []).some((k) => k.toLowerCase() === key.toLowerCase()));
  if (g) body += `<p><strong>${esc(g.title_es)}</strong></p><p>${esc(g.body_es)}</p><p>${esc(g.body_en)}</p>`;
  if (!f?.explanation && !g) body += `<p class="story">Sin entrada de glosario. El valor se muestra igual: no se oculta.</p>`;
  $("explain-body").innerHTML = body;
}

function markActiveRow() {
  $("fields")?.querySelectorAll(".field-row").forEach((el) => {
    el.classList.toggle("is-active", el.getAttribute("data-key") === activeKey);
  });
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

function renderMap(loadExternal) {
  const gps = analysis && findGps();
  if (!gps) {
    $("map").innerHTML = "<p class='empty'>No hay coordenadas GPS en este archivo.</p>";
    return;
  }
  const pair = gps.lat.toFixed(6) + ", " + gps.lon.toFixed(6);
  let html = `<div class="map-coords">${chip("GPS", pair, pair)}</div>
    <p class="story">Las coordenadas no se envían a ningún servidor hasta que cargas el mapa.</p>`;
  if (!loadExternal) {
    html += `<p><button type="button" id="load-map">Cargar mapa externo (OpenStreetMap)</button></p>`;
    $("map").innerHTML = html;
    $("load-map")?.addEventListener("click", () => renderMap(true));
    return;
  }
  const delta = 0.01;
  const bbox = [gps.lon - delta, gps.lat - delta, gps.lon + delta, gps.lat + delta].join(",");
  html += `
    <iframe title="Mapa OpenStreetMap" style="width:100%;height:360px;border:0;border-radius:10px"
      src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${gps.lat}%2C${gps.lon}"></iframe>
    <p><a href="https://www.openstreetmap.org/?mlat=${gps.lat}&mlon=${gps.lon}#map=16/${gps.lat}/${gps.lon}" target="_blank" rel="noreferrer">Abrir en OpenStreetMap</a></p>`;
  $("map").innerHTML = html;
}

function collectDates() {
  const skip = /(timescale|duration|bitrate|sample|offsettime|exposuretime|shutterspeed)/i;
  const re = /(date|time|created|modified|timestamp|mtime|ctime)/i;
  const out = [];
  for (const { section, field } of allFields()) {
    if (skip.test(field.key)) continue;
    if (re.test(field.key) || re.test(field.label)) {
      const parsed = Date.parse(normalizeDate(field.value));
      out.push({
        when: field.value,
        sort: Number.isNaN(parsed) ? null : parsed,
        label: field.key,
        source: section.label,
      });
    }
  }
  out.sort((a, b) => (a.sort ?? 1e15) - (b.sort ?? 1e15));
  return out;
}

function normalizeDate(v) {
  const exif = v.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (exif) return `${exif[1]}-${exif[2]}-${exif[3]}T${exif[4]}:${exif[5]}:${exif[6]}`;
  return v;
}

function renderTimeline() {
  if (!analysis) return;
  const q = query();
  const dates = collectDates().filter((d) => matchesQuery([d.source, d.label, d.when], q));
  if (!dates.length) {
    $("timeline").innerHTML = `<p class="empty">${q ? "Ninguna fecha coincide con el filtro." : "Sin fechas detectadas."}</p>`;
    return;
  }
  $("timeline").innerHTML = `<ol class="rail">${dates.map((d) => `
    <li>
      <span class="when">${esc(d.when)}</span>
      <div>
        <span class="tl-label">${esc(d.label)}</span>
        <span class="tl-src">${esc(d.source)}</span>
      </div>
    </li>`).join("")}</ol>`;
}

function first(keys) {
  for (const k of keys) {
    const hit = allFields().find((x) => x.field.key.toLowerCase() === k.toLowerCase());
    if (hit) return hit.field.value;
  }
  return "";
}

function formatBytes(n) {
  n = Number(n) || 0;
  if (n < 1024) return n + " B";
  const units = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
  const digits = n >= 10 || i === 0 ? 1 : 2;
  return n.toFixed(digits) + " " + units[i];
}

function copyText(text, label) {
  if (!text) return;
  const done = () => status((label || "Valor") + " copiado al portapapeles");
  const fail = () => status("No se pudo copiar");
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
  function fallback() {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy") ? done() : fail();
    } catch {
      fail();
    }
    ta.remove();
  }
}

function toCsv(a) {
  if (!a) return "";
  let s = "section,key,value,namespace,offset\n";
  for (const { section, field } of allFields()) {
    s += [section.label, field.key, field.value, field.namespace || "", field.offset ?? ""].map(csv).join(",") + "\n";
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
function escAttr(s) {
  return esc(s);
}

fetch("/api/glossary").then((r) => r.json()).then((j) => { glossary = j; }).catch(() => {});

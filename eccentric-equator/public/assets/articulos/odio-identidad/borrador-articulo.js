// Force clean page load if entering via view transition
// (Astro view transitions don't reliably re-execute inline scripts)
if (window.cardsData !== undefined) {
  window.location.reload();
}
var cardsData = [{"id":"q","label":"¿CÓMO EL SUFRIMIENTO SE CONVIERTE EN IDENTIDAD?","sub":"","w":340,"x":311,"y":69,"highlighted":true,"pinColor":"#4a6fa5","faded":false},{"id":"hm","label":"H. M. — EL SUJETO VULNERABLE","sub":"TEA G1, depresión, ansiedad. Nadie lo contuvo.","w":200,"x":14,"y":124,"highlighted":true,"pinColor":"#e74c3c","skin":"clip","faded":false},{"id":"normal","label":"\"SÓLO ERA UN NIÑO NORMAL\"","sub":"\"Era broma\", decían. Hablaba de matar gente. Nadie creyó.","w":155,"x":17,"y":761,"skin":"polaroid","img":"1- lo ven como bromas.jpeg","pinColor":"#7d7d7d","highlighted":false,"faded":false},{"id":"asis","label":"32% DE ASISTENCIA","sub":"32% de asistencia en IV medio. Flexibilizó en vez de contener.","w":165,"x":235,"y":888,"pinColor":"#7d7d7d","highlighted":false,"faded":false},{"id":"fasc","label":"2016 — LA SEMILLA","sub":"A los 9 años ya idealizaba tiroteos masivos. 8 años después los replicó al pie de la letra.","w":180,"x":753,"y":93,"pinColor":"#4a6fa5","highlighted":false,"faded":false},{"id":"alerta","label":"⚠️ 2022 — ALERTA IGNORADA","sub":"Psicopedagoga advirtió conductas antisociales. Nadie respondió.","w":190,"x":238,"y":236,"highlighted":true,"pinColor":"#e74c3c","faded":false},{"id":"trat","label":"SALUD MENTAL SIN ACCIÓN","sub":"Múltiples diagnósticos. Cero tratamiento efectivo.","w":175,"x":758,"y":217,"pinColor":"#4a6fa5","highlighted":false,"faded":false},{"id":"video","label":"VIDEO ANTICIPATORIO","sub":"Publicó el ataque en YouTube (37s, 3.800 vistas). Copió a un tirador finlandés.","w":210,"x":746,"y":368,"skin":"polaroid","img":"foto de video antes del ataque.jpeg","pinColor":"#7d7d7d","highlighted":false,"faded":false},{"id":"bromas","label":"\"ERAN BROMAS\" — EL ESCUDO","sub":"El humor negro como blindaje social: \"sólo bromeaba, ¿no entienden el chiste?\". Nadie denunció.","w":180,"x":18,"y":336,"highlighted":true,"skin":"postit","pinColor":"#4a6fa5","faded":false},{"id":"glos","label":"LENGUAJE DE LA OSCURIDAD","sub":"Blackpill, Going ER, Saint. Un idioma completo del odio.","w":185,"x":749,"y":703,"pinColor":"#6b4c3a","highlighted":false,"faded":false},{"id":"comu","label":"EL MANIFIESTO","sub":"<span class=\"brut\">NO</span> deseo envejecer<br><span class=\"brut\">NO</span> tengo intención<br><span class=\"brut\">NO</span> envejeceré","meta":"\"Aquellos como yo también se librarán.\"<br><br>En Discord encontró a personas como él. Por fin, un lugar donde pertenecer.","w":230,"x":470,"y":216,"highlighted":true,"skin":"evidence","quote":true,"pinColor":"#e74c3c","faded":false},{"id":"comunidad","label":"🔻 LA COMUNIDAD","sub":"Encontró a quienes pensaban igual. El vacío se volvió identidad compartida.","w":210,"x":226,"y":730,"highlighted":true,"skin":"evidence","pinColor":"#e74c3c","faded":false},{"id":"algo","label":"EL ALGORITMO COMO CÓMPLICE","sub":"Refuerzo por retroalimentación: más contenido dark → más validación → más escalada. Ingeniería de la adicción.","w":195,"x":500,"y":710,"pinColor":"#6b4c3a","highlighted":false,"faded":false},{"id":"odio","label":"\"YO SOY EL ODIO\" — LA FUSIÓN","sub":"El dolor se volvió esencia. \"No siento odio: SOY el odio\".","w":195,"x":233,"y":472,"highlighted":true,"pinColor":"#e74c3c","faded":false},{"id":"desh","label":"DESHUMANIZACIÓN BIDIRECCIONAL","sub":"Hacia adentro: el self fue un personaje. Hacia afuera: los otros, NPC.","w":210,"x":12,"y":585,"highlighted":true,"pinColor":"#e74c3c","faded":false},{"id":"plan","label":"PLAN DE ATAQUE","sub":"4 meses. 8 víctimas, niños de 1° básico. \"Matarlos para evitarles la vida adulta\".","w":185,"x":492,"y":887,"pinColor":"#7d7d7d","highlighted":false,"faded":false},{"id":"pant","label":"PANTEÓN DE ASESINOS","sub":"Auvinen, Yamaguchi, Bekmansurov, Henderson. Un altar portátil grabado en sus cuchillos.","w":210,"x":735,"y":773,"skin":"clip","faded":true,"pinColor":"#7d7d7d","img":"mejor forma de liberar tension es con un cadaver fresco.jpeg","highlighted":false},{"id":"ataque","label":"⛔ 27 MARZO 2026 — EL ACTO","sub":"1 muerta, 4 heridos. La identidad construida se manifestó.","w":210,"x":482,"y":533,"highlighted":true,"pinColor":"#e74c3c","faded":false},{"id":"cont","label":"EFECTO CONTAGIO","sub":"72h después Argentina replicó el patrón. Luego Brasil, México y una ola de amenazas virales.","w":185,"x":227,"y":705,"faded":true,"pinColor":"#7d7d7d","highlighted":false}];

var strings = [{"from":"q","to":"hm","color":"#8b1a1a","lineStyle":"solid"},{"from":"hm","to":"alerta","color":"#8b1a1a","lineStyle":"solid"},{"from":"alerta","to":"bromas","color":"#8b1a1a","lineStyle":"solid"},{"from":"bromas","to":"comu","color":"#8b1a1a","lineStyle":"solid"},{"from":"odio","to":"comu","color":"#8b1a1a","lineStyle":"solid"},{"from":"desh","to":"odio","color":"#8b1a1a","lineStyle":"solid"},{"from":"desh","to":"ataque","color":"#8b1a1a","lineStyle":"solid"},{"from":"fasc","to":"hm","color":"#4a6fa5","lineStyle":"dashed"},{"from":"fasc","to":"alerta","color":"#4a6fa5","lineStyle":"dashed"},{"from":"trat","to":"alerta","color":"#4a6fa5","lineStyle":"dotted"},{"from":"trat","to":"bromas","color":"#4a6fa5","lineStyle":"dotted"},{"from":"video","to":"comu","color":"#4a6fa5","lineStyle":"dashed"},{"from":"video","to":"bromas","color":"#4a6fa5","lineStyle":"dotted"},{"from":"glos","to":"comu","color":"#4a6fa5","lineStyle":"dotted"},{"from":"glos","to":"bromas","color":"#4a6fa5","lineStyle":"dashed"},{"from":"comunidad","to":"comu","color":"#8b6914","lineStyle":"dotted"},{"from":"comunidad","to":"odio","color":"#8b6914","lineStyle":"dotted"},{"from":"algo","to":"odio","color":"#8b6914","lineStyle":"dotted"},{"from":"algo","to":"desh","color":"#8b6914","lineStyle":"dotted"},{"from":"normal","to":"hm","color":"#7d7d7d","lineStyle":"dotted"},{"from":"asis","to":"alerta","color":"#7d7d7d","lineStyle":"dotted"},{"from":"plan","to":"ataque","color":"#7d7d7d","lineStyle":"dotted"},{"from":"desh","to":"pant","color":"#7d7d7d","lineStyle":"dotted"},{"from":"pant","to":"ataque","color":"#7d7d7d","lineStyle":"dotted"},{"from":"cont","to":"ataque","color":"#7d7d7d","lineStyle":"dotted"},{"from":"pant","to":"cont","color":"#7d7d7d","lineStyle":"dotted"},{"from":"plan","to":"normal","color":"#8b1a1a","lineStyle":"dotted"},{"from":"plan","to":"video","color":"#8b1a1a","lineStyle":"dotted"},{"from":"plan","to":"pant","color":"#8b1a1a","lineStyle":"dotted"}];
var connectSource = null;
var selectedColor = '#8b1a1a';
var selectedLineStyle = 'solid';
var lockedId = null;
var lockedSet = new Set();
var editMode = false;
var dragEl = null, dragOffX = 0, dragOffY = 0;

var cardStyles = ['default','postit','polaroid','evidence','clip'];

function centerX(w) { return (1000 - w) / 2; }

function render() {
  const c = document.getElementById('cards-container');
  c.innerHTML = '';
  cardsData.forEach((card, i) => {
    const div = document.createElement('div');
    div.className = 'editor-card';
    div.dataset.id = card.id;
    div.style.width = card.w + 'px';
    div.style.left = (card.x || centerX(card.w)) + 'px';
    div.style.top = (card.y || 40 + i * 42) + 'px';
    div.innerHTML = `
      <div class="ec-controls">
        <button class="ec-btn ec-highlight" title="Resaltar" onclick="toggleHighlight('${card.id}')">★</button>
        <button class="ec-btn ec-fade" title="Fade" onclick="toggleFade('${card.id}')">⊙</button>
        <button class="ec-btn ec-link" title="Conectar" onclick="connectCard('${card.id}')">⏝</button>
        <button class="ec-btn ec-pin" title="Color del pin" onclick="cyclePin('${card.id}')">📍</button>
        <button class="ec-btn ec-style" title="Estilo de tarjeta" onclick="cycleCardStyle('${card.id}')">◐</button>
      </div>
      ${card.img ? `<div class="ec-img-wrap"><img src="/assets/articulos/odio-identidad/${card.img}" alt="${card.label}" /></div>` : ''}
      <div class="ec-label">${card.label}</div>
      ${card.sub ? `<div class="ec-sub">${card.sub}</div>` : ''}
      ${card.meta ? `<div class="ec-meta">${card.meta}</div>` : ''}
    `;
    div.addEventListener('mouseenter', () => {
      if (editMode || pinFilters.size > 0) return;
      if (lockedSet.size > 0) {
        // Show union WITHOUT modifying lockedSet
        const hadIt = lockedSet.has(card.id);
        if (!hadIt) lockedSet.add(card.id);
        applyAccumulatedFocus();
        if (!hadIt) lockedSet.delete(card.id);
      } else {
        document.querySelectorAll('.editor-card').forEach(el => el.classList.remove('ec-focus','ec-dimmed'));
        document.querySelectorAll('#string-layer path').forEach(p => p.classList.remove('ec-string-focus','ec-string-dimmed'));
        if (card.id === 'asis' || card.id === 'cont' || card.id === 'pant' || card.id === 'plan' || card.id === 'normal' || card.id === 'video' || card.id === 'bromas') focusDirectConnections(card.id);
        else if (card.id === 'ataque') { focusRedNetwork(card.id); document.getElementById('string-layer').querySelectorAll('path').forEach((p,i) => { const s = strings[i]; if (s && s.from === 'cont' && s.to === 'ataque') { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); } }); const cel = document.querySelector('.editor-card[data-id="cont"]'); if (cel) { cel.classList.add('ec-focus'); cel.classList.remove('ec-dimmed'); } }
        else if (card.id === 'comu') { focusRedNetwork(card.id); document.getElementById('string-layer').querySelectorAll('path').forEach((p,i) => { const s = strings[i]; if (s && s.from === 'comunidad' && s.to === 'comu') { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); } }); const cel = document.querySelector('.editor-card[data-id="comunidad"]'); if (cel) { cel.classList.add('ec-focus'); cel.classList.remove('ec-dimmed'); } }
        else if (isInColorNetwork(card.id, '#8b1a1a')) focusRedNetwork(card.id);
        else if (isInColorNetwork(card.id, '#4a6fa5')) focusColorNetwork(card.id, '#4a6fa5');
        else if (isInColorNetwork(card.id, '#8b6914')) focusColorNetwork(card.id, '#8b6914');
        else if (isInColorNetwork(card.id, '#7d7d7d')) focusColorNetwork(card.id, '#7d7d7d');
      }
    });
    div.addEventListener('mouseleave', () => {
      if (editMode || pinFilters.size > 0) return;
      if (lockedSet.size > 0) applyAccumulatedFocus();
      else clearFocus();
    });
    div.addEventListener('click', e => {
      if (editMode) return;
      if (e.target.closest('.ec-btn')) return;
      if (lockedSet.has(card.id)) { lockedSet.delete(card.id); }
      else { lockedSet.add(card.id); }
      if (lockedSet.size === 0) clearFocus();
      else applyAccumulatedFocus();
    });
    div.addEventListener('mousedown', e => {
      if (!editMode) return;
      if (e.target.closest('.ec-btn')) return;
      dragEl = div; dragOffX = e.clientX - div.offsetLeft; dragOffY = e.clientY - div.offsetTop;
      div.style.cursor = 'grabbing'; div.style.zIndex = 100;
      e.preventDefault();
    });
    if (card.highlighted) div.classList.add('ec-highlighted');
    if (card.faded) div.classList.add('ec-faded');
    if (card.pinColor) div.style.setProperty('--pin', pinGradient(card.pinColor));
    if (card.skin && card.skin !== 'default') div.classList.add('card-' + card.skin);
    if (card.quote) div.classList.add('card-quote');
    c.appendChild(div);
  });
  renderStrings();
}

function toggleHighlight(id) {
  const el = document.querySelector(`.editor-card[data-id="${id}"]`);
  el.classList.toggle('ec-highlighted');
  updateStatus();
}
function toggleFade(id) {
  const el = document.querySelector(`.editor-card[data-id="${id}"]`);
  el.classList.toggle('ec-faded');
  updateStatus();
}

function connectCard(id) {
  const el = document.querySelector(`.editor-card[data-id="${id}"]`);
  if (!connectSource) {
    connectSource = id;
    document.querySelectorAll('.editor-card').forEach(c => c.style.outline = '');
    el.style.outline = '3px solid ' + selectedColor;
    el.style.outlineOffset = '4px';
    document.getElementById('status').textContent = 'Origen: ' + (cardsData.find(c => c.id === id)?.label || id) + ' — clic ⏝ en otra tarjeta';
  } else if (connectSource === id) {
    connectSource = null;
    el.style.outline = '';
    document.getElementById('status').textContent = 'Selección cancelada';
  } else {
    strings.push({from: connectSource, to: id, color: selectedColor, lineStyle: selectedLineStyle});
    document.querySelectorAll('.editor-card').forEach(c => c.style.outline = '');
    connectSource = null;
    renderStrings();
    document.getElementById('status').textContent = 'Hilo conectado';
  }
}

function cycleCardStyle(id) {
  const card = cardsData.find(c => c.id === id);
  const cur = card.skin || 'default';
  const idx = cardStyles.indexOf(cur);
  card.skin = cardStyles[(idx + 1) % cardStyles.length];
  const el = document.querySelector(`.editor-card[data-id="${id}"]`);
  el.className = el.className.replace(/card-\w+/g, '').trim() + ' ' + (card.skin !== 'default' ? 'card-' + card.skin : '');
  el.classList.add('editor-card');
}

function renderStrings() {
  const svg = document.getElementById('string-layer');
  const paths = strings.map(s => {
    const fc = cardsData.find(c => c.id === s.from);
    const tc = cardsData.find(c => c.id === s.to);
    if (!fc || !tc) return '';
    const fx = (fc.x || 0) + (fc.w || 150) / 2;
    const fy = (fc.y || 0) + 40;
    const tx = (tc.x || 0) + (tc.w || 150) / 2;
    const ty = (tc.y || 0) + 40;
    const dx = tx - fx, dy = ty - fy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const sag = Math.min(dist * 0.35, 80);
    const mx = (fx + tx) / 2, my = (fy + ty) / 2 + sag;
    const ls = s.lineStyle || 'solid';
    const cls = ls === 'dashed' ? 'ec-string-dashed' : ls === 'dotted' ? 'ec-string-dotted' : '';
    return `<path d="M ${fx} ${fy} Q ${mx} ${my} ${tx} ${ty}" class="ec-string ${cls}" style="stroke:${s.color || '#c0392b'}" />`;
  }).join('');
  svg.innerHTML = `<defs><style>.ec-string{stroke-width:2.5;fill:none;stroke-linecap:round;opacity:0.6}</style></defs>${paths}`;
}

function clearStrings() { strings = []; renderStrings(); connectSource = null; document.querySelectorAll('.editor-card').forEach(c => c.style.outline = ''); lockedSet.clear(); pinFilters.clear(); clearFocus(); document.getElementById('status').textContent = 'Hilos eliminados'; }
function undoLastString() { if (strings.length) { strings.pop(); renderStrings(); document.getElementById('status').textContent = 'Último hilo deshecho'; } }

function resetCards() {
  cardsData.forEach((c,i) => { c.x = centerX(c.w); c.y = 40 + i * 42; });
  document.querySelectorAll('.editor-card').forEach(e => e.remove());
  lockedSet.clear();
  render();
}

function toggleEditMode() {
  editMode = !editMode;
  const btn = document.getElementById('editBtn');
  const board = document.getElementById('board');
  if (editMode) {
    btn.style.opacity = '1';
    board.classList.add('edit-active');
    clearFocus(); lockedSet.clear();
  } else {
    btn.style.opacity = '0.4';
    board.classList.remove('edit-active');
  }
  document.getElementById('status').textContent = editMode ? '✏️ Modo edición activo' : '';
}

var pinColors = ['#e74c3c', '#4a6fa5', '#6b4c3a', '#7d7d7d', '#8b6914'];
function pinGradient(c) { const d = c==='#e74c3c'?'#8b1a1a':c==='#4a6fa5'?'#2c4a7c':c==='#6b4c3a'?'#3a2010':c==='#7d7d7d'?'#444':'#5c4410'; return `radial-gradient(circle at 4px 4px, ${c} 30%, ${d} 70%, ${d} 100%)`; }
function cyclePin(id) {
  const card = cardsData.find(c => c.id === id);
  const cur = card.pinColor || '#e74c3c';
  const idx = pinColors.indexOf(cur);
  card.pinColor = pinColors[(idx + 1) % pinColors.length];
  const el = document.querySelector(`.editor-card[data-id="${id}"]`);
  el.style.setProperty('--pin', pinGradient(card.pinColor));
}
function updateStatus() {
  const h = document.querySelectorAll('.ec-highlighted').length;
  const f = document.querySelectorAll('.ec-faded').length;
  const parts = [];
  if (h) parts.push('★ ' + h);
  if (f) parts.push('⊙ ' + f);
  document.getElementById('status').textContent = parts.join('  ') || '✨';
}
function saveBoard() {
  document.querySelectorAll('.editor-card').forEach(el => {
    const c = cardsData.find(d => d.id === el.dataset.id);
    if (c) { c.x = parseInt(el.style.left); c.y = parseInt(el.style.top); }
  });
  const json = JSON.stringify(cardsData);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).then(() => {
      document.getElementById('status').textContent = '✓ Copiado al portapapeles';
    }).catch(() => {
      console.log(json);
      document.getElementById('status').textContent = '✓ Mira la consola (F12)';
    });
  } else {
    console.log(json);
    document.getElementById('status').textContent = '✓ Mira la consola (F12)';
  }
}
function focusDirectConnections(id) {
  const connected = new Set([id]);
  strings.forEach(s => { if (s.from === id) connected.add(s.to); if (s.to === id) connected.add(s.from); });
  document.querySelectorAll('.editor-card').forEach(el => {
    if (connected.has(el.dataset.id)) { el.classList.add('ec-focus'); el.classList.remove('ec-dimmed'); }
    else { el.classList.add('ec-dimmed'); el.classList.remove('ec-focus'); }
  });
  document.querySelectorAll('#string-layer path').forEach((p, i) => {
    const s = strings[i];
    if (s && (s.from === id || s.to === id)) { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); }
    else { p.classList.add('ec-string-dimmed'); p.classList.remove('ec-string-focus'); }
  });
}

function focusRedNetwork(hoveredId) {
  const redSet = new Set();
  strings.forEach(s => {
    if (s.color === '#8b1a1a' && s.lineStyle === 'solid') { redSet.add(s.from); redSet.add(s.to); }
  });
  if (!redSet.has(hoveredId)) return;
  document.querySelectorAll('.editor-card').forEach(el => {
    if (redSet.has(el.dataset.id)) { el.classList.add('ec-focus'); el.classList.remove('ec-dimmed'); }
    else { el.classList.add('ec-dimmed'); el.classList.remove('ec-focus'); }
  });
  const svg = document.getElementById('string-layer');
  svg.querySelectorAll('path').forEach((p, i) => {
    const s = strings[i];
    if (s && s.color === '#8b1a1a' && s.lineStyle === 'solid') { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); }
    else { p.classList.add('ec-string-dimmed'); p.classList.remove('ec-string-focus'); }
  });
}
function isInColorNetwork(id, color) {
  return strings.some(s => s.color === color && (s.from === id || s.to === id));
}

function focusColorNetwork(hoveredId, color) {
  const net = new Set();
  strings.forEach(s => { if (s.color === color) { net.add(s.from); net.add(s.to); } });
  if (!net.has(hoveredId)) return;
  document.querySelectorAll('.editor-card').forEach(el => {
    if (net.has(el.dataset.id)) { el.classList.add('ec-focus'); el.classList.remove('ec-dimmed'); }
    else { el.classList.add('ec-dimmed'); el.classList.remove('ec-focus'); }
  });
  document.querySelectorAll('#string-layer path').forEach((p, i) => {
    const s = strings[i];
    if (s && s.color === color) { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); }
    else { p.classList.add('ec-string-dimmed'); p.classList.remove('ec-string-focus'); }
  });
}

function applyAccumulatedFocus() {
  const cardSet = new Set();
  const strSet = new Set();
  lockedSet.forEach(id => {
    const c = cardsData.find(d => d.id === id);
    if (!c) return;
    if (id === 'asis' || id === 'cont' || id === 'pant' || id === 'plan' || id === 'normal' || id === 'video' || id === 'bromas') {
      cardSet.add(id);
      strings.forEach((s,i) => { if (s.from === id || s.to === id) { cardSet.add(s.from); cardSet.add(s.to); strSet.add(i); } });
    } else if (id === 'ataque') {
      strings.forEach((s,i) => { if (s.color === '#8b1a1a' && s.lineStyle === 'solid') { cardSet.add(s.from); cardSet.add(s.to); strSet.add(i); } });
      strings.forEach((s,i) => { if (s.from === 'cont' && s.to === 'ataque') { cardSet.add('cont'); strSet.add(i); } });
    } else if (id === 'comu') {
      strings.forEach((s,i) => { if (s.color === '#8b1a1a' && s.lineStyle === 'solid') { cardSet.add(s.from); cardSet.add(s.to); strSet.add(i); } });
      strings.forEach((s,i) => { if (s.from === 'comunidad' && s.to === 'comu') { cardSet.add('comunidad'); strSet.add(i); } });
    } else {
      let color = null;
      if (isInColorNetwork(id, '#8b1a1a')) color = '#8b1a1a';
      else if (isInColorNetwork(id, '#4a6fa5')) color = '#4a6fa5';
      else if (isInColorNetwork(id, '#8b6914')) color = '#8b6914';
      else if (isInColorNetwork(id, '#7d7d7d')) color = '#7d7d7d';
      if (color) {
        const redSolid = color === '#8b1a1a';
        strings.forEach((s,i) => {
          if (s.color === color && (!redSolid || s.lineStyle === 'solid')) { cardSet.add(s.from); cardSet.add(s.to); strSet.add(i); }
        });
      }
    }
  });
  document.querySelectorAll('.editor-card').forEach(el => {
    if (cardSet.has(el.dataset.id)) { el.classList.add('ec-focus'); el.classList.remove('ec-dimmed'); }
    else { el.classList.add('ec-dimmed'); el.classList.remove('ec-focus'); }
  });
  document.querySelectorAll('#string-layer path').forEach((p,i) => {
    if (strSet.has(i)) { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); }
    else { p.classList.add('ec-string-dimmed'); p.classList.remove('ec-string-focus'); }
  });
}

function clearFocus() {
  document.querySelectorAll('.editor-card').forEach(el => {
    el.classList.remove('ec-focus','ec-dimmed','ec-focus-pin','ec-dimmed-pin');
  });
  document.querySelectorAll('#string-layer path').forEach(p => {
    p.classList.remove('ec-string-focus','ec-string-dimmed');
  });
}

var pinFilters = new Set();
function togglePinFilter(color) {
  const btn = document.querySelector(`.pf-btn[style*="${color}"]`);
  if (pinFilters.has(color)) { pinFilters.delete(color); btn?.classList.remove('active'); }
  else { pinFilters.add(color); btn?.classList.add('active'); }
  document.querySelectorAll('.editor-card').forEach(el => {
    el.classList.remove('ec-focus-pin','ec-dimmed-pin');
    if (pinFilters.size === 0) return;
    let match = false;
    pinFilters.forEach(c => {
      const card = cardsData.find(d => d.id === el.dataset.id);
      if ((card?.pinColor || '#e74c3c') === c) match = true;
    });
    if (match) el.classList.add('ec-focus-pin');
    else el.classList.add('ec-dimmed-pin');
  });
}

function applyFocus(id) {
  if (id === 'asis' || id === 'cont' || id === 'pant' || id === 'plan' || id === 'normal' || id === 'video' || id === 'bromas') focusDirectConnections(id);
  else if (id === 'ataque') { focusRedNetwork(id); document.getElementById('string-layer').querySelectorAll('path').forEach((p,i) => { const s = strings[i]; if (s && s.from === 'cont' && s.to === 'ataque') { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); } }); const cel = document.querySelector('.editor-card[data-id="cont"]'); if (cel) { cel.classList.add('ec-focus'); cel.classList.remove('ec-dimmed'); } }
  else if (id === 'comu') { focusRedNetwork(id); document.getElementById('string-layer').querySelectorAll('path').forEach((p,i) => { const s = strings[i]; if (s && s.from === 'comunidad' && s.to === 'comu') { p.classList.add('ec-string-focus'); p.classList.remove('ec-string-dimmed'); } }); const cel = document.querySelector('.editor-card[data-id="comunidad"]'); if (cel) { cel.classList.add('ec-focus'); cel.classList.remove('ec-dimmed'); } }
  else if (isInColorNetwork(id, '#8b1a1a')) focusRedNetwork(id);
  else if (isInColorNetwork(id, '#4a6fa5')) focusColorNetwork(id, '#4a6fa5');
  else if (isInColorNetwork(id, '#8b6914')) focusColorNetwork(id, '#8b6914');
  else if (isInColorNetwork(id, '#7d7d7d')) focusColorNetwork(id, '#7d7d7d');
}

document.addEventListener('mousemove', e => {
  if (!editMode || !dragEl) return;
  dragEl.style.left = (e.clientX - dragOffX) + 'px';
  dragEl.style.top = (e.clientY - dragOffY) + 'px';
  const c = cardsData.find(c => c.id === dragEl.dataset.id);
  if (c) { c.x = parseInt(dragEl.style.left); c.y = parseInt(dragEl.style.top); }
  renderStrings();
});
document.addEventListener('mouseup', () => {
  if (dragEl) { dragEl.style.cursor = 'grab'; dragEl.style.zIndex = ''; dragEl = null; }
});
function hfInitBoard() {
  if (window.__hfBoardInit) return;
  window.__hfBoardInit = true;

  document.querySelectorAll('.cp-dot').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.cp-dot').forEach(o => o.classList.remove('active'));
      el.classList.add('active');
      selectedColor = el.dataset.color;
      const src = document.querySelector(`.editor-card[data-id="${connectSource}"]`);
      if (src) { src.style.outline = '3px solid ' + selectedColor; src.style.outlineOffset = '4px'; }
    });
  });
  document.getElementById('board').addEventListener('click', (e) => {
    if (editMode) return;
    if (e.target.closest('.editor-card')) return;
    lockedSet.clear(); clearFocus();
  });
  document.querySelectorAll('.ls-opt').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.ls-opt').forEach(o => o.classList.remove('active'));
      el.classList.add('active');
      selectedLineStyle = el.dataset.style;
    });
  });
}
hfInitBoard();
document.querySelector('.cp-dot')?.classList.add('active');
document.addEventListener('astro:page-load', function() { setTimeout(render, 300); });
render();

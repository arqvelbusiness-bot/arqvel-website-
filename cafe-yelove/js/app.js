/* Cafe Yelove — website logic: menu, table ordering, reservations */
(function () {
  const cfg = window.YELOVE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const priceOf = (it, i = 0) => Array.isArray(it.p) ? it.p[i] : it.p;
  const priceLabel = (it) => Array.isArray(it.p) ? it.p.map(fmt).join(' / ') : fmt(it.p);
  function findItem(name) { for (const k in MENU) { const it = MENU[k].items.find((x) => x.n === name); if (it) return { cat: k, it }; } return null; }
  function toast(t) { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600); }

  /* ---------- table (from the QR link: index.html?table=7) ---------- */
  let table = null;
  (function () {
    const q = new URLSearchParams(location.search).get('table') || (location.hash.match(/table=(\d+)/) || [])[1];
    let t = parseInt(q, 10);
    if (!t) { try { t = parseInt(sessionStorage.getItem('yelove_table'), 10); } catch (e) {} }
    if (t >= 1 && t <= (cfg.TABLES || 50)) { table = t; try { sessionStorage.setItem('yelove_table', String(t)); } catch (e) {} }
  })();
  /* table + name chosen by the customer in the order panel (pre-filled from the QR) */
  const tSel = $('#tTable'), tName = $('#tName');
  for (let i = 1; i <= (cfg.TABLES || 15); i++) tSel.insertAdjacentHTML('beforeend', `<option value="${i}">${i}</option>`);
  if (table) tSel.value = String(table);
  try { tName.value = localStorage.getItem('yelove_name') || ''; } catch (e) {}
  tSel.addEventListener('change', () => { tSel.classList.remove('bad'); const v = parseInt(tSel.value, 10); table = v || null; try { v ? sessionStorage.setItem('yelove_table', String(v)) : sessionStorage.removeItem('yelove_table'); } catch (e) {} showTable(); updateTray(); });
  tName.addEventListener('input', () => { tName.classList.remove('bad'); try { localStorage.setItem('yelove_name', tName.value.trim()); } catch (e) {} });
  function showTable() { $('#tablePill').hidden = !table; if (table) $('#tablePillTxt').textContent = 'Table ' + table; }
  if (false) {
    $('#tablePill').hidden = false; $('#tablePillTxt').textContent = 'Table ' + table;
    $('#heroLead').textContent = 'Welcome to Table ' + table + '. Browse the menu, add what you like, and your order goes straight to the kitchen.';
  }

  /* ---------- sold out ---------- */
  let soldOut = new Set();
  async function refreshSoldOut() { try { const n = new Set(await Store.soldOut()); if (n.size === soldOut.size && [...n].every((x) => soldOut.has(x))) return; soldOut = n; renderItems(); renderMood(curMood); } catch (e) {} }

  /* ---------- scenes ---------- */
  const tip = $('#tip');
  Scene.hero($('#heroCanvas'), {
    onPick: (k, n) => goToItem(k, n),
    onHover: (label, e) => { if (label && e) { tip.textContent = label; tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; tip.classList.add('on'); } else tip.classList.remove('on'); }
  });
  const ex = Scene.explorer($('#exCanvas'));
  const lab = Scene.lab($('#labCanvas'));

  /* ---------- menu ---------- */
  let cat = 'pizza', vf = 'all', q = '', activeName = null; const optSel = {};
  $('#tabs').innerHTML = Object.entries(MENU).map(([k, c]) => `<button class="tab${k === cat ? ' on' : ''}" data-c="${k}">${c.t}</button>`).join('');
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) setCat(b.dataset.c); });
  $('#vf').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; vf = b.dataset.v; $$('#vf button').forEach((x) => x.classList.toggle('on', x === b)); renderItems(); });
  $('#q').addEventListener('input', (e) => { q = e.target.value.trim().toLowerCase(); renderItems(); });
  function setCat(k, keep) {
    cat = k; $$('.tab').forEach((b) => b.classList.toggle('on', b.dataset.c === k));
    const c = MENU[k]; $('#stNum').textContent = c.n + ' — ' + c.h; $('#stCat').textContent = c.t; $('#catNote').textContent = c.note;
    if (!keep) setActive(c.items.find((i) => i.m === c.m) || c.items[0], k);
    renderItems();
  }
  function setActive(it, k) {
    activeName = it.n; ex.show(it.m || MENU[k || cat].m);
    $('#stDish').textContent = it.n; $('#stPrice').textContent = soldOut.has(it.n) ? 'Sold out today' : priceLabel(it);
    $$('.item').forEach((e) => e.classList.toggle('active', e.dataset.n === it.n));
  }
  const vdot = (v) => `<span class="vd${v === 0 ? ' nv' : v === 2 ? ' mx' : ''}"></span>`;
  function renderItems() {
    let list;
    if (q) { list = []; for (const k in MENU) MENU[k].items.forEach((it) => { if ((it.n + ' ' + it.d).toLowerCase().includes(q)) list.push([k, it]); }); }
    else list = MENU[cat].items.map((it) => [cat, it]);
    list = list.filter(([, it]) => vf === 'all' || (vf === 'veg' ? it.v !== 0 : it.v !== 1));
    $('#items').innerHTML = list.length ? list.map(([k, it], i) => {
      const sel = optSel[it.n] || 0, out = soldOut.has(it.n);
      return `<div class="item${it.n === activeName ? ' active' : ''}${out ? ' out' : ''}" data-n="${esc(it.n)}" data-c="${k}" style="animation-delay:${Math.min(i, 10) * 35}ms">${vdot(it.v)}
        <div><h4>${esc(it.n)}${out ? '<span class="soldtag">Sold out</span>' : it.tag ? `<span class="tag">${it.tag}</span>` : ''}</h4><p>${esc(it.d)}${q ? ` · <i>${MENU[k].t}</i>` : ''}</p>
        ${it.o ? `<div class="opts">${it.o.map((o, j) => `<button class="opt${j === sel ? ' on' : ''}" data-j="${j}">${esc(o)}${Array.isArray(it.p) ? ' ' + fmt(it.p[j]) : ''}</button>`).join('')}</div>` : ''}</div>
        <div class="pr"><b>${Array.isArray(it.p) ? fmt(it.p[sel]) : fmt(it.p)}</b><button class="add" aria-label="Add ${esc(it.n)}">+</button></div></div>`;
    }).join('') : '<div class="empty">Nothing matches — try another search.</div>';
  }
  $('#items').addEventListener('click', (e) => {
    const card = e.target.closest('.item'); if (!card) return;
    const k = card.dataset.c, it = MENU[k].items.find((x) => x.n === card.dataset.n);
    const ob = e.target.closest('.opt'); if (ob) { optSel[it.n] = +ob.dataset.j; renderItems(); setActive(it, k); return; }
    if (e.target.closest('.add')) { const j = optSel[it.n] || 0; addToTray(it.n, priceOf(it, j), it.o ? it.o[j] : null); setActive(it, k); return; }
    setActive(it, k);
  });
  function goToItem(k, name) { q = ''; $('#q').value = ''; setCat(k, true); const f = findItem(name); if (f) setActive(f.it, k); $('#menu').scrollIntoView({ behavior: 'smooth' }); }
  setCat('pizza', true); setActive(MENU.pizza.items[5], 'pizza'); renderItems();

  /* ---------- drinks ---------- */
  const LAB = [
    ['pink', 'Pink Lady', null, ['#3a1d0f', '#e6a3b3', '#f1c3cd'], 'A vibrant fusion of pink matcha and bold espresso — creamy, earthy-sweet, with a rich coffee kick.'],
    ['ocean', 'Ocean Latte', null, ['#2a76a3', '#86bdd8', '#f3f0e8'], 'Espresso meets an ocean-blue hue in a smooth, vibrant latte.'],
    ['spanish', 'Spanish Latte', null, ['#552c16', '#a8714a', '#eedbb5'], 'Espresso, milk and condensed milk — rich, smooth and sweet.'],
    ['latte', 'Latte (Hot/Iced)', 'Iced', ['#64381e', '#e0ccae', '#f1e8da'], 'Vanilla, hazelnut, caramel or tiramisu — pick your flavour.'],
    ['cold', 'Cold Coffee', null, ['#9c704c', '#bf926a', '#d8c09f'], 'Chilled coffee blended with milk and ice. The classic.']
  ];
  let curDrink = 0;
  $('#swatches').innerHTML = LAB.map((d, i) => `<button class="sw${i ? '' : ' on'}" data-i="${i}"><i style="background:linear-gradient(180deg,${d[3].join(',')})"></i>${d[1].replace(' (Hot/Iced)', '')}</button>`).join('');
  function setDrink(i) {
    curDrink = i; const d = LAB[i], f = findItem(d[1]);
    $('#dName').textContent = d[1].replace(' (Hot/Iced)', ''); $('#dPrice').textContent = fmt(priceOf(f.it)); $('#dNote').textContent = d[4];
    document.documentElement.style.setProperty('--glow', d[3][1]);
    $$('.sw').forEach((b) => b.classList.toggle('on', +b.dataset.i === i)); lab.set(d[0]);
  }
  $('#swatches').addEventListener('click', (e) => { const b = e.target.closest('.sw'); if (b && +b.dataset.i !== curDrink) setDrink(+b.dataset.i); });
  $('#dAdd').onclick = () => { const d = LAB[curDrink], f = findItem(d[1]); if (soldOut.has(f.it.n)) return toast(f.it.n + ' is sold out today'); addToTray(f.it.n, priceOf(f.it), d[2]); };
  $('#dNote').textContent = LAB[0][4];

  /* ---------- moods ---------- */
  const MOODS = {
    'Date night': ['Pesto Milano Pizza', 'Beef Chimichurri', 'Pink Lady', 'Tiramisu Shake'],
    'Friends night': ['Chicken Overloaded Pizza', 'Fries', 'Chicken Wings', 'Oreo Shake'],
    'Solo & study': ['Spanish Latte', 'Cheese Garlic Bread', 'Mac & Cheese'],
    'Sweet tooth': ['Ferrero Rocher Shake', 'Biscoff Shake', 'Triple Chocolate Shake'],
    'All vegetarian': ['Paneer Twist Pizza', 'Honey Chilli Paneer', 'Fettuccine Alfredo', 'Ocean Latte']
  };
  let curMood = 'Date night';
  $('#moods').innerHTML = Object.keys(MOODS).map((m, i) => `<button class="mood${i ? '' : ' on'}">${m}</button>`).join('');
  function renderMood(m) {
    curMood = m; const picks = MOODS[m].map(findItem).filter(Boolean);
    $('#picks').innerHTML = picks.map(({ cat: k, it }, i) => `<div class="pick" style="animation-delay:${i * 70}ms"><span class="cat">${MENU[k].t}</span><h4>${esc(it.n)}</h4><p style="color:var(--muted);font-size:14px;line-height:1.5">${esc(it.d)}</p>
      <div class="row"><b>${soldOut.has(it.n) ? 'Sold out' : fmt(priceOf(it))}</b><span><button class="linkbtn" data-go="${k}|${esc(it.n)}">View 3D</button> <button class="add" data-add="${esc(it.n)}"${soldOut.has(it.n) ? ' disabled' : ''}>+</button></span></div></div>`).join('');
    const avail = picks.filter((p) => !soldOut.has(p.it.n)), tot = avail.reduce((a, x) => a + priceOf(x.it), 0);
    $('#moodTotal').innerHTML = `<span>Whole set: <b style="color:var(--ink)">${fmt(tot)}</b> + GST</span><button class="btn sm" id="addAll">Add the whole set</button>`;
    $('#addAll').onclick = () => avail.forEach(({ it }) => addToTray(it.n, priceOf(it), it.o ? it.o[0] : null));
  }
  $('#moods').addEventListener('click', (e) => { const b = e.target.closest('.mood'); if (!b) return; $$('.mood').forEach((x) => x.classList.toggle('on', x === b)); renderMood(b.textContent); });
  $('#picks').addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'), a = e.target.closest('[data-add]');
    if (g) { const [k, n] = g.dataset.go.split('|'); goToItem(k, n); }
    if (a) { const f = findItem(a.dataset.add); addToTray(f.it.n, priceOf(f.it), f.it.o ? f.it.o[0] : null); }
  });
  renderMood(curMood);

  /* ---------- order tray ---------- */
  let tray = [];
  try { tray = JSON.parse(sessionStorage.getItem('yelove_tray')) || []; } catch (e) {}
  const saveTray = () => { try { sessionStorage.setItem('yelove_tray', JSON.stringify(tray)); } catch (e) {} };
  function addToTray(name, price, option) {
    if (soldOut.has(name)) return toast(name + ' is sold out today');
    const key = name + (option ? ' · ' + option : ''); const f = tray.find((x) => x.key === key);
    f ? f.qty++ : tray.push({ key, name, option, price, qty: 1 });
    saveTray(); updateTray(); const b = $('#trayBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); toast('Added ' + key);
  }
  function totals() { const sub = tray.reduce((a, x) => a + x.qty * x.price, 0), gst = Math.round(sub * (cfg.GST_RATE || 0.05)); return { n: tray.reduce((a, x) => a + x.qty, 0), sub, gst, all: sub + gst }; }
  function updateTray() {
    const t = totals();
    $('#tCnt').textContent = t.n; $('#tTot').textContent = fmt(t.all); $('#trayBtn').classList.toggle('show', t.n > 0);
    $('#tLabel').textContent = table ? 'Table ' + table : 'Your order';
    $('#tTitle').textContent = table ? 'Table ' + table + ' order' : 'Your order';
    $('#tSub').textContent = fmt(t.sub); $('#tGst').textContent = fmt(t.gst); $('#tAll').textContent = fmt(t.all);
    $('#tList').innerHTML = tray.length ? tray.map((x, i) => `<div class="tl"><div><h5>${esc(x.key)}</h5><small>${fmt(x.price)}</small></div><div class="qty"><button data-i="${i}" data-d="-1" aria-label="Less">−</button><b>${x.qty}</b><button data-i="${i}" data-d="1" aria-label="More">+</button></div></div>`).join('') : '<p class="empty">Nothing here yet.</p>';
    $('#tInfo').textContent = 'Your order goes straight to the kitchen. Pay at the counter by UPI, cash or card.';
    const s = $('#tSend'); s.disabled = !tray.length; s.textContent = 'Place order · ' + fmt(t.all);
  }
  $('#tList').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const x = tray[+b.dataset.i]; x.qty += +b.dataset.d; if (x.qty <= 0) tray.splice(+b.dataset.i, 1); saveTray(); updateTray(); if (!tray.length) closeTray(); });
  const openTray = () => { $('#tray').classList.add('open'); $('#scrim').classList.add('on'); }, closeTray = () => { $('#tray').classList.remove('open'); $('#scrim').classList.remove('on'); };
  $('#trayBtn').onclick = openTray; $('#tClose').onclick = closeTray; $('#scrim').onclick = closeTray;
  $('#tSend').onclick = async () => {
    const s = $('#tSend'); if (!tray.length) return;
    const nm = tName.value.trim(), tb = parseInt(tSel.value, 10);
    if (!nm || !tb) { if (!nm) tName.classList.add('bad'); if (!tb) tSel.classList.add('bad'); toast(!nm && !tb ? 'Please add your name and table number' : !nm ? 'Please add your name' : 'Please choose your table number'); (!nm ? tName : tSel).focus(); return; }
    s.disabled = true; s.textContent = 'Sending to the kitchen…';
    try {
      const o = await Store.placeOrder({ table: tb, name: nm, items: tray.map((x) => ({ name: x.name, option: x.option, qty: x.qty, price: x.price })), note: $('#tNote').value });
      tray = []; saveTray(); $('#tNote').value = ''; updateTray(); closeTray(); showConfirm(o);
    } catch (err) { toast(err.message || 'Could not send the order. Please call a server.'); updateTray(); }
  };

  /* ---------- order confirmation with café UPI QR ---------- */
  function showConfirm(o) {
    const pay = `<div class="upi"><b>Pay ${fmt(o.total)} at the counter</b><p class="muted" style="margin-top:6px">Cash or UPI at the counter, after your meal.</p></div>`;
    $('#sheet').innerHTML = `<div class="tick">✓</div><h3>Order sent to the kitchen</h3><div class="code">${esc(o.code)}</div><p class="muted">${esc(o.customer_name)} · Table ${o.table_no} · show this number at the counter when you pay</p>
      <div class="lines">${o.items.map((i) => `<div><span>${i.qty} × ${esc(i.name)}${i.option ? ' (' + esc(i.option) + ')' : ''}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
      <div><span>GST (5%)</span><span>${fmt(o.gst)}</span></div><div class="t"><span>Total</span><span>${fmt(o.total)}</span></div></div>
      ${pay}<p class="muted">Staff will confirm your payment. Want something else? Just add it and place another order.</p>
      <button class="btn ghost" id="cDone" style="margin-top:16px;justify-content:center;width:100%">Done</button>`;
    $('#confirm').classList.add('on'); $('#cDone').onclick = () => $('#confirm').classList.remove('on');
  }
  $('#confirm').addEventListener('click', (e) => { if (e.target.id === 'confirm') $('#confirm').classList.remove('on'); });
  updateTray();

  /* ---------- reservations ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const d0 = new Date(), today = `${d0.getFullYear()}-${pad(d0.getMonth() + 1)}-${pad(d0.getDate())}`;
  const rDate = $('#rDate'); rDate.min = today; rDate.value = today;
  const max = new Date(Date.now() + 60 * 864e5); rDate.max = `${max.getFullYear()}-${pad(max.getMonth() + 1)}-${pad(max.getDate())}`;
  let guests = '2';
  $('#guests').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; guests = b.textContent; $$('#guests button').forEach((x) => x.classList.toggle('on', x === b)); });
  $('#resv').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = e.target, st = $('#rStatus'), btn = $('#rBtn');
    const data = { name: f.name.value.trim(), phone: f.phone.value.trim(), date: f.date.value, time: f.time.value, guests, note: f.note.value.trim() };
    st.className = 'fstatus'; btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await Store.reserve(data);
      const nice = new Date(data.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      st.className = 'fstatus ok'; st.textContent = `Thanks, ${data.name}! Your request for ${data.guests} on ${nice} at ${data.time} is in. We'll confirm by call or WhatsApp shortly.`;
      f.name.value = ''; f.phone.value = ''; f.note.value = '';
    } catch (err) { st.className = 'fstatus err'; st.textContent = err.message || 'Something went wrong. Please call us.'; }
    btn.disabled = false; btn.textContent = 'Request booking';
  });

  /* ---------- page ---------- */
  addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 40), { passive: true });
  const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => ro.observe(el));
  const hide = () => $('#loader').classList.add('done');
  document.addEventListener('scene:ready', () => setTimeout(hide, 200)); setTimeout(hide, 2500);
  refreshSoldOut(); Store.subscribe((t) => { if (t !== 'orders' && t !== 'reservations') refreshSoldOut(); });
})();

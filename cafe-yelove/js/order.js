/* Cafe Yelove — QR table ordering app (phone first) */
(function () {
  const cfg = window.YELOVE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fmt = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const thumb = (m) => 'thumbs/' + String(m || 'pizza:margherita').replace(':', '-') + '.webp';
  const ss = { get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2600); };
  const TABLES = cfg.TABLES || 15, GST = cfg.GST_RATE || 0.05;
  const CATS = Object.keys(MENU);
  const item = (c, i) => MENU[c].items[i];
  const priceOf = (it, opt) => { if (Array.isArray(it.p)) { const j = it.o ? it.o.indexOf(opt) : -1; return it.p[j >= 0 ? j : 0]; } return it.p; };
  const vclass = (v) => v === 0 ? ' nv' : v === 2 ? ' mx' : '';

  /* ---------- state ---------- */
  let cart = ss.get('yelove_cart', []);           // [{c,i,name,option,price,qty,m}]
  let table = parseInt(new URLSearchParams(location.search).get('table'), 10) || ss.get('yelove_table', null);
  if (!(table >= 1 && table <= TABLES)) table = null;
  let soldOut = new Set(), vegOnly = false, q = '';
  const saveCart = () => ss.set('yelove_cart', cart);

  /* ---------- table ---------- */
  function setTable(t) {
    table = t; ss.set('yelove_table', t);
    const b = $('#tableBtn'); b.classList.toggle('none', !t); $('#tableTxt').textContent = t ? 'Table ' + t : 'Pick table';
    $('#cTable').value = t ? String(t) : ''; $('#cTable').classList.remove('bad');
    $$('#tGrid button').forEach((x) => x.classList.toggle('on', +x.dataset.t === t));
  }
  $('#tGrid').innerHTML = Array.from({ length: TABLES }, (_, k) => `<button data-t="${k + 1}">${k + 1}</button>`).join('');
  $('#cTable').insertAdjacentHTML('beforeend', Array.from({ length: TABLES }, (_, k) => `<option value="${k + 1}">${k + 1}</option>`).join(''));
  $('#tGrid').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setTable(+b.dataset.t); closeSheet(); toast('Table ' + b.dataset.t + ' selected'); });
  $('#tableBtn').onclick = () => openSheet('#tableSheet');
  $('#cTable').onchange = (e) => setTable(parseInt(e.target.value, 10) || null);
  setTable(table);
  const nameIn = $('#cName'); nameIn.value = ls.get('yelove_name', '');
  nameIn.addEventListener('input', () => { nameIn.classList.remove('bad'); ls.set('yelove_name', nameIn.value.trim()); });

  /* ---------- categories + menu ---------- */
  $('#cats').innerHTML = CATS.map((c, k) => `<button class="cat${k ? '' : ' on'}" data-c="${c}">${esc(MENU[c].t)}</button>`).join('') + `<button class="cat veg" id="vegBtn"><span class="vmark"></span>Veg only</button>`;
  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('.cat'); if (!b) return;
    if (b.id === 'vegBtn') { vegOnly = !vegOnly; b.classList.toggle('on', vegOnly); render(); return; }
    const sec = document.getElementById('c-' + b.dataset.c); if (sec) { spyLock = Date.now(); setChip(b.dataset.c); scrollTo({ top: sec.getBoundingClientRect().top + scrollY - $('.top').offsetHeight + 2, behavior: 'smooth' }); }
  });
  function qtyFor(c, i) { return cart.filter((x) => x.c === c && x.i === i).reduce((a, x) => a + x.qty, 0); }
  function control(c, i, it) {
    if (soldOut.has(it.n)) return `<button class="add" disabled>SOLD OUT</button>`;
    const n = qtyFor(c, i);
    if (it.o) return `<button class="add${n ? ' has' : ''}" data-a="open">${n ? n + ' ADDED' : 'ADD +'}</button>`;
    if (!n) return `<button class="add" data-a="add">ADD</button>`;
    return `<div class="stepper"><button data-a="dec" aria-label="Less">−</button><b>${n}</b><button data-a="inc" aria-label="More">+</button></div>`;
  }
  function render() {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    let html = '', any = false;
    CATS.forEach((c) => {
      const cat = MENU[c];
      const list = cat.items.map((it, i) => [it, i]).filter(([it]) => (!vegOnly || it.v !== 0) && (!words.length || words.every((w) => (it.n + ' ' + it.d + ' ' + cat.t).toLowerCase().includes(w))));
      if (!list.length) return; any = true;
      html += `<section class="sec" id="c-${c}" data-c="${c}"><h2>${esc(cat.t)}<small>${esc(cat.h)}</small></h2>${cat.note ? `<div class="note">${esc(cat.note)}</div>` : ''}`;
      list.forEach(([it, i]) => {
        const price = Array.isArray(it.p) ? `${fmt(it.p[0])} <small>onwards</small>` : fmt(it.p);
        html += `<article class="dish${soldOut.has(it.n) ? ' out' : ''}" data-c="${c}" data-i="${i}">
          <div class="info"><div class="row1"><span class="vmark${vclass(it.v)}"></span>${it.tag ? `<span class="badge">${esc(it.tag)}</span>` : ''}</div>
            <h3>${esc(it.n)}</h3><div class="price">${price}</div><p>${esc(it.d)}</p></div>
          <div><div class="pic"><img src="${thumb(it.m)}" alt="" loading="lazy" decoding="async">${control(c, i, it)}</div>${it.o && !soldOut.has(it.n) ? '<span class="custom">Options available</span>' : ''}</div></article>`;
      });
      html += '</section>';
    });
    $('#menu').innerHTML = any ? html : '<div class="empty">No dishes match. Try another search.</div>';
    spy();
  }
  function refreshControls() {
    $$('.dish').forEach((d) => { const c = d.dataset.c, i = +d.dataset.i, it = item(c, i); const pic = d.querySelector('.pic'); const old = pic.querySelector('.add,.stepper'); old.insertAdjacentHTML('afterend', control(c, i, it)); old.remove(); });
  }
  $('#menu').addEventListener('click', (e) => {
    const d = e.target.closest('.dish'); if (!d) return;
    const c = d.dataset.c, i = +d.dataset.i, it = item(c, i), a = e.target.closest('[data-a]');
    if (soldOut.has(it.n)) return toast(it.n + ' is sold out today');
    if (!a || a.dataset.a === 'open') return openDish(c, i);
    if (a.dataset.a === 'add' || a.dataset.a === 'inc') addLine(c, i, null, 1, true);
    if (a.dataset.a === 'dec') changeLine(c, i, null, -1);
  });

  /* scroll spy */
  let spyObs = null, spyLock = 0;
  function setChip(c) { $$('#cats .cat[data-c]').forEach((b) => { const on = b.dataset.c === c; b.classList.toggle('on', on); if (on) { const n = $('#cats'); n.scrollTo({ left: b.offsetLeft - n.clientWidth / 2 + b.clientWidth / 2, behavior: 'smooth' }); } }); }
  function spy() {
    if (spyObs) spyObs.disconnect();
    spyObs = new IntersectionObserver((es) => { if (Date.now() - spyLock < 800) return; es.forEach((e) => { if (e.isIntersecting) setChip(e.target.dataset.c); }); }, { rootMargin: '-130px 0px -65% 0px' });
    $$('.sec').forEach((s) => spyObs.observe(s));
  }

  /* search */
  $('#searchBtn').onclick = () => { const b = $('#searchBox'); b.classList.toggle('on'); if (b.classList.contains('on')) $('#q').focus(); else { $('#q').value = ''; q = ''; render(); } };
  $('#q').addEventListener('input', (e) => { q = e.target.value.trim(); $('#welcome').style.display = q ? 'none' : ''; render(); });

  /* ---------- cart ---------- */
  function addLine(c, i, option, qty, quiet) {
    const it = item(c, i), price = priceOf(it, option);
    const f = cart.find((x) => x.c === c && x.i === i && (x.option || null) === (option || null));
    if (f) f.qty = Math.min(20, f.qty + qty); else cart.push({ c, i, name: it.n, option: option || null, price, qty: Math.min(20, qty), m: it.m });
    saveCart(); updateCart(true); refreshControls();
    if (!quiet || qty > 1 || option) toast('Added ' + it.n + (option ? ' · ' + option : ''));
  }
  function changeLine(c, i, option, d) {
    const k = cart.findIndex((x) => x.c === c && x.i === i && (option === undefined || (x.option || null) === (option || null)));
    if (k < 0) return; cart[k].qty += d; if (cart[k].qty <= 0) cart.splice(k, 1); else cart[k].qty = Math.min(20, cart[k].qty);
    saveCart(); updateCart(); refreshControls();
  }
  const totals = () => { const sub = cart.reduce((a, x) => a + x.price * x.qty, 0), gst = Math.round(sub * GST); return { n: cart.reduce((a, x) => a + x.qty, 0), sub, gst, all: sub + gst }; };
  function updateCart(bump) {
    const t = totals(), bar = $('#cbar');
    bar.classList.toggle('show', t.n > 0 && !$('.sheet.on'));
    $('#cbarN').textContent = t.n + (t.n === 1 ? ' item' : ' items') + ' · incl. GST'; $('#cbarT').textContent = fmt(t.all);
    if (bump) { bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump'); }
    $('#cSub').textContent = table ? `Table ${table} · ${t.n} ${t.n === 1 ? 'item' : 'items'}` : `${t.n} ${t.n === 1 ? 'item' : 'items'}`;
    $('#cLines').innerHTML = cart.map((x, k) => `<div class="line"><img src="${thumb(x.m)}" alt=""><div><h4>${esc(x.name)}</h4>${x.option ? `<small>${esc(x.option)}</small>` : ''}<div class="lp">${fmt(x.price * x.qty)}</div></div>
      <div class="mini"><button data-k="${k}" data-d="-1" aria-label="Less">−</button><b>${x.qty}</b><button data-k="${k}" data-d="1" aria-label="More">+</button></div></div>`).join('');
    $('#cBill').innerHTML = `<div><span>Item total</span><span>${fmt(t.sub)}</span></div><div><span>GST (5%)</span><span>${fmt(t.gst)}</span></div><div class="t"><span>To pay at the counter</span><span>${fmt(t.all)}</span></div>`;
    const p = $('#cPlace'); p.disabled = !t.n; p.textContent = 'Place order · ' + fmt(t.all);
  }
  $('#cLines').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return; const x = cart[+b.dataset.k];
    x.qty += +b.dataset.d; if (x.qty <= 0) cart.splice(+b.dataset.k, 1); else x.qty = Math.min(20, x.qty);
    saveCart(); updateCart(); refreshControls(); if (!cart.length) closeSheet();
  });
  $('#cbar').onclick = () => openSheet('#cartSheet');

  /* ---------- place order ---------- */
  $('#cPlace').onclick = async () => {
    const name = nameIn.value.trim(), tb = parseInt($('#cTable').value, 10);
    if (!name || !tb) {
      if (!name) nameIn.classList.add('bad'); if (!tb) $('#cTable').classList.add('bad');
      toast(!name && !tb ? 'Add your name and table number' : !name ? 'Add your name' : 'Choose your table number');
      (!name ? nameIn : $('#cTable')).scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
    }
    const recent = ls.get('yelove_my_orders', []).filter((o) => Date.now() - new Date(o.at) < 10 * 60e3);
    if (recent.length >= 3) return toast('You placed several orders just now. Please ask the staff if you need help.');
    const bad = cart.find((x) => soldOut.has(x.name)); if (bad) return toast(bad.name + ' just sold out. Please remove it.');
    const btn = $('#cPlace'); btn.disabled = true; btn.textContent = 'Sending to the kitchen…';
    try {
      const o = await Store.placeOrder({ table: tb, name, items: cart.map((x) => ({ name: x.name, option: x.option, qty: x.qty, price: x.price })), note: $('#cNote').value });
      const mine = ls.get('yelove_my_orders', []).filter((m) => new Date(m.at).toDateString() === new Date().toDateString());
      mine.unshift({ code: o.code, total: o.total, n: o.items.reduce((a, i) => a + i.qty, 0), at: o.created_at, table: o.table_no, items: o.items }); ls.set('yelove_my_orders', mine.slice(0, 20));
      cart = []; saveCart(); $('#cNote').value = ''; closeSheet(); updateCart(); refreshControls(); updateMine(); showDone(o);
    } catch (err) { toast(err.message || 'Could not send the order. Please ask the staff.'); updateCart(); }
  };
  function showDone(o) {
    $('#doneBody').innerHTML = `<div class="tick"><svg viewBox="0 0 48 48"><path d="M13 25l8 8 15-17"/></svg></div>
      <h2>Order sent to the kitchen</h2><div class="who">${esc(o.customer_name)} · Table ${o.table_no}</div>
      <div class="ticket"><div class="code"><div><small>Order number</small><b>${esc(o.code)}</b></div><span class="vmark" style="opacity:0"></span></div>
        ${o.items.map((i) => `<div class="tl"><span>${i.qty} × ${esc(i.name)}${i.option ? ' <small style="color:var(--dim)">(' + esc(i.option) + ')</small>' : ''}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
        <div class="tl"><span>GST (5%)</span><span>${fmt(o.gst)}</span></div><div class="tl t"><span>Total</span><span>${fmt(o.total)}</span></div></div>
      <div class="counter"><i>₹</i><div><b>Pay at the counter</b><span>Show order ${esc(o.code)} · cash or UPI</span></div></div>
      <div class="dbtns"><button class="cta" id="doneMore">Order something else</button></div>`;
    $('#done').classList.add('on'); document.body.classList.add('locked');
    $('#doneMore').onclick = () => { $('#done').classList.remove('on'); document.body.classList.remove('locked'); };
  }

  /* ---------- my orders ---------- */
  function updateMine() {
    const mine = ls.get('yelove_my_orders', []).filter((m) => new Date(m.at).toDateString() === new Date().toDateString());
    $('#myBtn').hidden = !mine.length; $('#myCount').textContent = mine.length;
    $('#myList').innerHTML = mine.map((m) => `<div class="mo"><div><b>${esc(m.code)}</b><small>Table ${m.table} · ${new Date(m.at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · ${m.n} ${m.n === 1 ? 'item' : 'items'}</small></div><strong>${fmt(m.total)}</strong></div>`).join('');
  }
  $('#myBtn').onclick = () => openSheet('#mySheet');

  /* ---------- sheets ---------- */
  let openId = null;
  function openSheet(sel) {
    closeSheet(true); openId = sel; $(sel).classList.add('on'); $('#scrim').classList.add('on'); document.body.classList.add('locked'); $('#cbar').classList.remove('show');
    if (sel === '#cartSheet') updateCart();
    history.pushState({ sheet: sel }, '');
  }
  function closeSheet(silent) {
    if (!openId) return; $(openId).classList.remove('on'); $('#scrim').classList.remove('on'); document.body.classList.remove('locked');
    if (openId === '#dishSheet') stop3D();
    openId = null; updateCart();
    if (!silent && history.state && history.state.sheet) history.back();
  }
  addEventListener('popstate', () => { if (openId) { const id = openId; openId = id; $(id).classList.remove('on'); $('#scrim').classList.remove('on'); document.body.classList.remove('locked'); if (id === '#dishSheet') stop3D(); openId = null; updateCart(); } });
  $('#scrim').onclick = () => closeSheet();
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheet()));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  /* ---------- dish sheet with live 3D ---------- */
  let cur = null, dQty = 1, dOpt = null;
  function openDish(c, i) {
    const it = item(c, i); cur = { c, i, it }; dQty = 1; dOpt = it.o ? it.o[0] : null;
    const img = $('#dImg'); img.src = thumb(it.m); img.classList.remove('off'); $('#dCanvas').classList.remove('on');
    $('#dHead').innerHTML = `<div class="row1" style="display:flex;gap:8px;align-items:center"><span class="vmark${vclass(it.v)}"></span>${it.tag ? `<span class="badge">${esc(it.tag)}</span>` : ''}</div><h3>${esc(it.n)}</h3><p>${esc(it.d)}</p>`;
    $('#dOpts').innerHTML = it.o ? `<div class="opth">Choose one</div><div class="opts">${it.o.map((o, k) => `<button class="optc${k ? '' : ' on'}" data-o="${esc(o)}"><span><span class="rd"></span>${esc(o)}</span>${Array.isArray(it.p) ? `<b>${fmt(it.p[k])}</b>` : ''}</button>`).join('')}</div>` : '';
    updDish(); openSheet('#dishSheet'); $('#dishSheet .sbody').scrollTop = 0; start3D(it.m);
  }
  function updDish() { const p = priceOf(cur.it, dOpt); $('#dQty').textContent = dQty; $('#dAdd').textContent = 'Add · ' + fmt(p * dQty); }
  $('#dOpts').addEventListener('click', (e) => { const b = e.target.closest('.optc'); if (!b) return; dOpt = b.dataset.o; $$('.optc').forEach((x) => x.classList.toggle('on', x === b)); updDish(); });
  $('#dMinus').onclick = () => { dQty = Math.max(1, dQty - 1); updDish(); };
  $('#dPlus').onclick = () => { dQty = Math.min(20, dQty + 1); updDish(); };
  $('#dAdd').onclick = () => { if (soldOut.has(cur.it.n)) return toast(cur.it.n + ' is sold out today'); addLine(cur.c, cur.i, dOpt, dQty); closeSheet(); };

  // 3D is loaded only when a dish is opened, and skipped on slow phones / data saver.
  const lite = (navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let viewer = null, loading = null, wantKey = null;
  const loadScript = (src) => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  function ensure3D() {
    if (viewer) return Promise.resolve(viewer);
    if (!loading) loading = (window.THREE ? Promise.resolve() : loadScript('js/vendor/three.min.js')).then(() => window.Scene ? 0 : loadScript('js/scene.js')).then(() => {
      if (!window.Scene || !Scene.ok) throw new Error('no 3d');
      viewer = Scene.explorer($('#dCanvas')); return viewer;
    });
    return loading;
  }
  function start3D(key) {
    if (lite) return; wantKey = key;
    ensure3D().then((v) => { if (openId !== '#dishSheet' || wantKey !== key) return; v.show(key); setTimeout(() => { if (wantKey === key && openId === '#dishSheet') { $('#dCanvas').classList.add('on'); $('#dImg').classList.add('off'); } }, 350); }).catch(() => {});
  }
  function stop3D() { wantKey = null; }

  /* ---------- sold-out sync ---------- */
  async function loadSoldOut() { try { const s = new Set(await Store.soldOut()); const changed = s.size !== soldOut.size || [...s].some((x) => !soldOut.has(x)); soldOut = s; if (changed) render(); } catch (e) {} }
  if (Store.live) { try { Store.subscribe((t) => { if (t === 'menu_availability') loadSoldOut(); }); } catch (e) {} setInterval(loadSoldOut, 60000); }
  else addEventListener('storage', (e) => { if (e.key === 'yelove_soldout') loadSoldOut(); });

  /* ---------- go ---------- */
  render(); updateCart(); updateMine(); loadSoldOut();
  if (!table) setTimeout(() => { if (!openId && !table) openSheet('#tableSheet'); }, 900);
})();

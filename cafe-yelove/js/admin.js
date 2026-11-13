/* Cafe Yelove — counter dashboard */
(function () {
  const cfg = window.YELOVE_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const fmt = (n) => '₹' + Math.round(n || 0).toLocaleString('en-IN');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (t) => { const e = $('#toast'); e.textContent = t; e.classList.add('on'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('on'), 2400); };
  const pad = (n) => String(n).padStart(2, '0');
  const localDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => localDay(new Date());
  const ago = (iso) => { const m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min ago'; };
  const clock = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

  /* ---------- login ---------- */
  $('#mode').textContent = Store.live ? 'Live' : 'Demo mode';
  $('#mode').classList.toggle('live', Store.live);
  if (!Store.live) { $('#lEmail').style.display = 'none'; $('#lPass').placeholder = 'Counter PIN'; $('#lHint').textContent = 'Demo mode · PIN is set in js/config.js'; $('#resetBtn').hidden = false; }
  $('#lform').addEventListener('submit', async (e) => {
    e.preventDefault(); $('#lErr').textContent = '';
    try { await Store.signIn($('#lEmail').value.trim(), $('#lPass').value); start(); }
    catch (err) { $('#lErr').textContent = err.message || 'Could not sign in'; }
  });
  $('#outBtn').onclick = async () => { await Store.signOut(); location.reload(); };
  $('#resetBtn').onclick = () => { if (confirm('Clear all demo orders, bookings and sold-out flags?')) { Store.resetDemo(); load(); } };

  /* ---------- tabs ---------- */
  $$('.tab').forEach((t) => t.onclick = () => { $$('.tab').forEach((x) => x.classList.toggle('on', x === t)); $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'v-' + t.dataset.v)); });

  /* ---------- sound for new orders ---------- */
  let sound = true, actx = null;
  $('#soundBtn').onclick = () => { sound = !sound; $('#soundBtn').textContent = sound ? 'Sound on' : 'Sound off'; if (sound) chime(); };
  function chime() {
    if (!sound) return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); [660, 880].forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.type = 'sine'; g.gain.setValueAtTime(0.0001, actx.currentTime + i * 0.18); g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + i * 0.18 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + i * 0.18 + 0.35); o.connect(g).connect(actx.destination); o.start(actx.currentTime + i * 0.18); o.stop(actx.currentTime + i * 0.18 + 0.4); }); } catch (e) {}
  }

  /* ---------- data ---------- */
  let orders = [], res = [], soldOut = new Set(), seen = null, fresh = new Set(), rf = 'upcoming';
  async function load() {
    try {
      const [o, r, s] = await Promise.all([Store.listOrders(), Store.listReservations(), Store.soldOut()]);
      const ids = new Set(o.map((x) => x.id));
      if (seen) { const nw = o.filter((x) => !seen.has(x.id)); if (nw.length) { nw.forEach((x) => fresh.add(x.id)); chime(); toast(nw.length === 1 ? 'New order · ' + (nw[0].customer_name || 'Guest') + ' · Table ' + nw[0].table_no : nw.length + ' new orders'); setTimeout(() => { nw.forEach((x) => fresh.delete(x.id)); renderOrders(); }, 12000); } }
      seen = ids; orders = o; res = r; soldOut = new Set(s);
      renderOrders(); renderRes(); renderMenu(); renderStats();
    } catch (err) { toast('Could not load data: ' + (err.message || err)); }
  }

  function renderStats() {
    const t = today(), todays = orders.filter((o) => localDay(new Date(o.created_at)) === t && o.status !== 'cancelled');
    $('#sOrders').textContent = todays.length;
    $('#sUnpaid').textContent = fmt(todays.filter((o) => !o.paid).reduce((a, o) => a + Number(o.total), 0));
    $('#sPaid').textContent = fmt(todays.filter((o) => o.paid).reduce((a, o) => a + Number(o.total), 0));
    $('#sRes').textContent = res.filter((r) => r.date === t && r.status !== 'declined').length;
    const open = orders.filter((o) => o.status === 'new').length; $('#nOrders').textContent = open || '';
    const ask = res.filter((r) => r.status === 'requested').length; $('#nRes').textContent = ask || '';
    $('#nMenu').textContent = soldOut.size || '';
    document.title = (open ? '(' + open + ') ' : '') + 'Counter · Cafe Yelove';
  }

  /* ---------- orders ---------- */
  function card(o) {
    const items = (o.items || []).map((i) => `<li><span><b>${i.qty} ×</b> ${esc(i.name)}${i.option ? ' <small>(' + esc(i.option) + ')</small>' : ''}</span><span>${fmt(i.price * i.qty)}</span></li>`).join('');
    const pay = o.paid ? `<span class="pill paid">Paid · ${esc(o.paid_method || '')}</span>` : `<span class="pill unpaid">Not paid</span>`;
    const next = o.status === 'new' ? `<button class="btn terra sm" data-a="preparing">Start preparing</button>` : o.status === 'preparing' ? `<button class="btn sm" data-a="served">Mark served</button>` : '';
    const payBtns = o.paid ? '' : `<div class="paybox"><span>Check it reached the café's UPI app or till, then mark:</span><button class="btn green sm" data-p="UPI">Paid UPI</button><button class="btn green sm" data-p="Cash">Cash</button><button class="btn green sm" data-p="Card">Card</button></div>`;
    return `<article class="oc${fresh.has(o.id) ? ' fresh' : ''}" data-id="${o.id}"><div class="top"><div><div class="code">${esc(o.code)}</div><div class="tbl"><b class="cn">${esc(o.customer_name || 'Guest')}</b> · Table ${o.table_no} · ${clock(o.created_at)} · ${ago(o.created_at)}</div></div>${pay}</div>
      <ul>${items}</ul>${o.note ? `<div class="note">Note: ${esc(o.note)}</div>` : ''}
      <div class="tot"><span>Total incl. GST</span><span>${fmt(o.total)}</span></div>${payBtns}
      <div class="acts">${next}<button class="cancel" data-a="cancelled">Cancel</button></div></article>`;
  }
  function renderOrders() {
    const t = today(), live = orders.filter((o) => o.status !== 'cancelled' && !(o.status === 'served' && o.paid));
    const col = (st) => live.filter((o) => o.status === st).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    [['new', '#colNew', '#cNew'], ['preparing', '#colPrep', '#cPrep'], ['served', '#colServed', '#cServed']].forEach(([st, el, c]) => {
      const l = col(st); $(c).textContent = l.length || '';
      $(el).innerHTML = l.length ? l.map(card).join('') : `<div class="empty">${st === 'new' ? 'No new orders. They appear here the moment a table orders.' : 'Nothing here'}</div>`;
    });
    const done = orders.filter((o) => localDay(new Date(o.created_at)) === t && ((o.status === 'served' && o.paid) || o.status === 'cancelled'));
    $('#doneSum').textContent = `Completed today (${done.length})`;
    $('#doneList').innerHTML = done.map((o) => `<div class="row"><span><b>${esc(o.code)}</b> · ${esc(o.customer_name || 'Guest')} · Table ${o.table_no} · ${clock(o.created_at)}</span><span>${o.status === 'cancelled' ? 'Cancelled' : fmt(o.total) + ' · ' + esc(o.paid_method || 'Paid')}</span></div>`).join('') || '<p class="empty" style="margin-top:8px">Nothing yet</p>';
  }
  $('#v-orders').addEventListener('click', async (e) => {
    const c = e.target.closest('.oc'); if (!c) return; const id = c.dataset.id, a = e.target.closest('[data-a]'), p = e.target.closest('[data-p]');
    try {
      if (a) { if (a.dataset.a === 'cancelled' && !confirm('Cancel this order?')) return; await Store.updateOrder(id, { status: a.dataset.a }); }
      if (p) await Store.updateOrder(id, { paid: true, paid_method: p.dataset.p });
      load();
    } catch (err) { toast('Could not update: ' + (err.message || err)); }
  });

  /* ---------- reservations ---------- */
  $('#rfilter').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; rf = b.dataset.f; $$('#rfilter .chip').forEach((x) => x.classList.toggle('on', x === b)); renderRes(); });
  const toMin = (t) => { const m = String(t).match(/(\d+):(\d+)\s*(AM|PM)?/i); if (!m) return 0; let h = +m[1] % 12; if (/pm/i.test(m[3] || '')) h += 12; return h * 60 + +m[2]; };
  function renderRes() {
    const t = today();
    let l = res.slice();
    if (rf === 'upcoming') l = l.filter((r) => r.date >= t && r.status !== 'declined');
    if (rf === 'requested') l = l.filter((r) => r.status === 'requested');
    l.sort((a, b) => a.date.localeCompare(b.date) || toMin(a.time) - toMin(b.time));
    if (!l.length) { $('#resList').innerHTML = '<div class="empty">No bookings here yet. Requests from the website appear instantly.</div>'; return; }
    let day = '', html = '';
    l.forEach((r) => {
      if (r.date !== day) { day = r.date; const d = new Date(r.date + 'T00:00'); html += `<div class="rday">${r.date === t ? 'Today · ' : ''}${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>`; }
      const ph = String(r.phone).replace(/\D/g, '').slice(-10);
      html += `<div class="rc" data-id="${r.id}"><div class="time">${esc(r.time)}</div>
        <div class="who"><b>${esc(r.name)}</b> · ${esc(r.guests)} ${r.guests === '1' ? 'guest' : 'guests'} <span class="pill st-${r.status}">${r.status}</span><small><a href="tel:+91${ph}">+91 ${ph}</a>${r.note ? ` · <span class="note">${esc(r.note)}</span>` : ''}</small></div>
        <div class="acts">${r.status === 'requested' ? `<button class="btn green sm" data-r="confirmed">Confirm on WhatsApp</button><button class="btn ghost sm" data-r="declined">Decline</button>` : ''}${r.status === 'confirmed' ? `<button class="btn sm" data-r="seated">Seated</button>` : ''}<a class="btn ghost sm" href="tel:+91${ph}">Call</a></div></div>`;
    });
    $('#resList').innerHTML = html;
  }
  $('#resList').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-r]'); if (!b) return; const id = b.closest('.rc').dataset.id, r = res.find((x) => x.id === id), st = b.dataset.r;
    const ph = String(r.phone).replace(/\D/g, '').slice(-10), nice = new Date(r.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const msg = st === 'confirmed' ? `Hi ${r.name}, your table for ${r.guests} at ${cfg.CAFE_NAME} on ${nice} at ${r.time} is confirmed. See you soon!`
      : st === 'declined' ? `Hi ${r.name}, sorry, we're fully booked on ${nice} at ${r.time}. Would another time work for you? - ${cfg.CAFE_NAME}` : null;
    if (st === 'declined' && !confirm('Decline this booking? WhatsApp opens with a polite message.')) return;
    if (msg) window.open(`https://wa.me/91${ph}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    try { await Store.updateReservation(id, { status: st }); load(); } catch (err) { toast('Could not update: ' + (err.message || err)); }
  });

  /* ---------- menu availability ---------- */
  $('#mq').addEventListener('input', renderMenu);
  function renderMenu() {
    const q = $('#mq').value.trim().toLowerCase();
    $('#menuList').innerHTML = Object.values(MENU).map((c) => {
      const items = c.items.filter((i) => !q || i.n.toLowerCase().includes(q)); if (!items.length) return '';
      return `<div class="mcat">${c.t}</div><div class="mgrid">${items.map((i) => { const out = soldOut.has(i.n); return `<div class="mi${out ? ' out' : ''}"><div><span>${esc(i.n)}</span><small>${out ? 'Sold out' : 'Available'}</small></div><button class="sw${out ? ' off' : ''}" data-n="${esc(i.n)}" aria-label="Toggle ${esc(i.n)}"></button></div>`; }).join('')}</div>`;
    }).join('');
  }
  $('#menuList').addEventListener('click', async (e) => {
    const b = e.target.closest('.sw'); if (!b) return; const n = b.dataset.n, out = !soldOut.has(n);
    try { await Store.setSoldOut(n, out); out ? soldOut.add(n) : soldOut.delete(n); renderMenu(); renderStats(); toast(n + (out ? ' marked sold out' : ' back on the menu')); } catch (err) { toast('Could not update: ' + (err.message || err)); }
  });

  /* ---------- order history ---------- */
  let hData = [], hRange = 'today';
  const dayStart = (s) => new Date(s + 'T00:00');
  function setRange(r) {
    const n = new Date(), t = localDay(n); let f = t, to = t;
    if (r === 'yesterday') { f = to = localDay(new Date(Date.now() - 864e5)); }
    else if (r === '7') f = localDay(new Date(Date.now() - 6 * 864e5));
    else if (r === '30') f = localDay(new Date(Date.now() - 29 * 864e5));
    else if (r === 'month') f = `${n.getFullYear()}-${pad(n.getMonth() + 1)}-01`;
    $('#hFrom').value = f; $('#hTo').value = to; hRange = r;
    $$('#hRange .chip').forEach((c) => c.classList.toggle('on', c.dataset.r === r));
  }
  async function loadHistory() {
    const f = $('#hFrom').value, t = $('#hTo').value; if (!f || !t) return;
    const from = dayStart(f).toISOString(), to = new Date(dayStart(t).getTime() + 864e5).toISOString();
    try { hData = await Store.orderHistory(from, to); renderHistory(); } catch (err) { toast('Could not load history: ' + (err.message || err)); }
  }
  function hFiltered() {
    const q = $('#hq').value.trim().toLowerCase(), st = $('#hStatus').value;
    return hData.filter((o) => {
      if (st === 'paid' && !o.paid) return false;
      if (st === 'unpaid' && (o.paid || o.status === 'cancelled')) return false;
      if (st === 'cancelled' && o.status !== 'cancelled') return false;
      if (!q) return true;
      return (o.code + ' ' + (o.customer_name || '') + ' table ' + o.table_no + ' ' + (o.items || []).map((i) => i.name).join(' ')).toLowerCase().includes(q);
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  function renderHistory() {
    const l = hFiltered(), valid = l.filter((o) => o.status !== 'cancelled'), paid = valid.filter((o) => o.paid);
    const rev = paid.reduce((a, o) => a + Number(o.total), 0), due = valid.filter((o) => !o.paid).reduce((a, o) => a + Number(o.total), 0);
    $('#hSum').innerHTML = `<div><b>${valid.length}</b><span>Orders</span></div><div><b>${fmt(rev)}</b><span>Collected</span></div><div><b>${fmt(valid.length ? (rev + due) / valid.length : 0)}</b><span>Average order</span></div><div><b>${fmt(due)}</b><span>Not marked paid</span></div>`;
    const top = {}; valid.forEach((o) => (o.items || []).forEach((i) => { top[i.name] = (top[i.name] || 0) + Number(i.qty); }));
    const best = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const pm = {}; paid.forEach((o) => { const k = o.paid_method || 'Other'; pm[k] = (pm[k] || 0) + Number(o.total); });
    $('#hTop').innerHTML = `<h4>Best-sellers</h4>${best.length ? `<ol>${best.map(([n, q]) => `<li>${esc(n)}<span>${q}</span></li>`).join('')}</ol>` : '<p style="color:var(--muted);font-size:13px">No orders in this range</p>'}
      ${Object.keys(pm).length ? `<h4 style="margin-top:18px">Payments</h4><ol style="list-style:none;padding:0">${Object.entries(pm).map(([k, v]) => `<li>${esc(k)}<span>${fmt(v)}</span></li>`).join('')}</ol>` : ''}`;
    if (!l.length) { $('#hList').innerHTML = '<div class="empty">No orders for these filters.</div>'; return; }
    let day = '', html = '';
    const byDay = {}; l.forEach((o) => { const d = localDay(new Date(o.created_at)); (byDay[d] = byDay[d] || []).push(o); });
    Object.keys(byDay).sort().reverse().forEach((d) => {
      const os = byDay[d], tot = os.filter((o) => o.paid && o.status !== 'cancelled').reduce((a, o) => a + Number(o.total), 0);
      html += `<div class="hday">${d === today() ? 'Today · ' : ''}${dayStart(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}<small>${os.length} orders · ${fmt(tot)} collected</small></div>`;
      os.forEach((o) => {
        const st = o.status === 'cancelled' ? '<span class="pill st-declined">Cancelled</span>' : o.paid ? `<span class="pill paid">${esc(o.paid_method || 'Paid')}</span>` : '<span class="pill unpaid">Not paid</span>';
        html += `<details class="hitem"><summary><span>${clock(o.created_at)}</span><span class="c">${esc(o.code)}</span><span class="tb">${esc(o.customer_name || 'Guest')} · T${o.table_no}</span><span class="it">${(o.items || []).map((i) => i.qty + '× ' + esc(i.name)).join(', ')}</span><b>${fmt(o.total)}</b>${st}</summary>
          <div class="body">${(o.items || []).map((i) => `<div><span>${i.qty} × ${esc(i.name)}${i.option ? ' (' + esc(i.option) + ')' : ''}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
          <div><span>GST</span><span>${fmt(o.gst)}</span></div>${o.note ? `<div><span>Note: ${esc(o.note)}</span><span></span></div>` : ''}</div></details>`;
      });
    });
    $('#hList').innerHTML = html;
  }
  $('#hRange').addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (!b) return; setRange(b.dataset.r); loadHistory(); });
  ['#hFrom', '#hTo'].forEach((s) => $(s).addEventListener('change', () => { $$('#hRange .chip').forEach((c) => c.classList.remove('on')); hRange = 'custom'; loadHistory(); }));
  $('#hq').addEventListener('input', renderHistory); $('#hStatus').addEventListener('change', renderHistory);
  $('#hCsv').onclick = () => {
    const rows = [['Date', 'Time', 'Order', 'Customer', 'Table', 'Items', 'Subtotal', 'GST', 'Total', 'Status', 'Paid', 'Method', 'Note']];
    hFiltered().forEach((o) => rows.push([localDay(new Date(o.created_at)), clock(o.created_at), o.code, o.customer_name || '', o.table_no, (o.items || []).map((i) => i.qty + 'x ' + i.name + (i.option ? ' (' + i.option + ')' : '')).join('; '), o.subtotal, o.gst, o.total, o.status, o.paid ? 'Yes' : 'No', o.paid_method || '', o.note || '']));
    const csv = '﻿' + rows.map((r) => r.map((v) => { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `cafe-yelove-orders-${$('#hFrom').value}-to-${$('#hTo').value}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  setRange('today');
  $$('.tab').forEach((t) => t.addEventListener('click', () => { if (t.dataset.v === 'hist') loadHistory(); }));

  /* ---------- start ---------- */
  let started = false;
  function start() {
    if (started) return; started = true;
    $('#login').style.display = 'none'; $('#app').style.display = 'block';
    if (Store.live) Store.syncPrices().catch((e) => toast('Menu prices not synced: ' + (e.message || e) + ' (run supabase/upgrade-1-safety.sql)'));
    load(); Store.subscribe(() => { load(); if ($('#v-hist').classList.contains('on')) loadHistory(); });
    setInterval(renderOrders, 60000);
  }
  Store.session().then((ok) => { if (ok) start(); });
})();

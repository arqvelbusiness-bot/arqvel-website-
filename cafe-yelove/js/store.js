/* Cafe Yelove — data layer.
   Demo mode: localStorage (same browser, live across tabs).
   Live mode: Supabase (database + realtime + staff login). */
window.Store = (function () {
  const cfg = window.YELOVE_CONFIG || {};
  const live = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  const sb = live ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  const K = { o: 'yelove_orders', r: 'yelove_reservations', s: 'yelove_soldout' };
  const LS = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  // RFC 4122 v4 UUID. crypto.randomUUID only exists on https/localhost, so fall back to getRandomValues (works on local Wi-Fi http too).
  const uid = () => {
    if (window.crypto && crypto.randomUUID && window.isSecureContext) return crypto.randomUUID();
    const b = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
  const shortCode = () => { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 3; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };
  const ok = (r) => { if (r.error) throw r.error; return r.data; };

  /* real price of a dish (+ option) from js/menu.js — the database re-checks this too */
  const getMenu = () => (typeof MENU !== 'undefined' ? MENU : window.MENU) || {};
  function menuPrice(name, option) {
    const M = getMenu();
    for (const k in M) for (const it of M[k].items) if (it.n === name) {
      if (Array.isArray(it.p)) { const j = it.o ? it.o.indexOf(option) : -1; return it.p[j >= 0 ? j : 0]; }
      return it.p;
    }
    return null;
  }
  function priceRows() {
    const rows = [], M = getMenu();
    for (const k in M) for (const it of M[k].items) {
      if (Array.isArray(it.p)) { rows.push({ name: it.n, option: '', price: it.p[0] }); (it.o || []).forEach((o, i) => rows.push({ name: it.n, option: o, price: it.p[i] })); }
      else { rows.push({ name: it.n, option: '', price: it.p }); (it.o || []).forEach((o) => rows.push({ name: it.n, option: o, price: it.p })); }
    }
    return rows;
  }
  async function syncPrices() {
    if (!live) return 0;
    const rows = priceRows().map((r) => Object.assign(r, { updated_at: new Date().toISOString() }));
    ok(await sb.from('menu_prices').upsert(rows, { onConflict: 'name,option' }));
    return rows.length;
  }
  const friendly = (e) => {
    const m = (e && (e.message || e.details)) || '';
    if (/Failed to fetch|NetworkError|network|Load failed/i.test(m)) return new Error('No internet connection. Please check your Wi-Fi or ask the staff.');
    return new Error(m || 'Could not send the order. Please ask the staff.');
  };

  async function placeOrder({ table, name, items, note }) {
    const t = parseInt(table, 10);
    if (!t || t < 1 || t > (cfg.TABLES || 50)) throw new Error('Please choose your table number');
    const who = String(name || '').trim().slice(0, 40);
    if (!who) throw new Error('Please add your name');
    if (!items || !items.length) throw new Error('Your order is empty');
    const clean = items.map(i => {
      const nm = String(i.name).slice(0, 120), op = i.option ? String(i.option).slice(0, 60) : null, p = menuPrice(nm, op);
      if (p == null) throw new Error('Sorry, ' + nm + ' is not on the menu');
      return { name: nm, option: op, qty: Math.max(1, Math.min(20, parseInt(i.qty, 10) || 1)), price: p };
    });
    if (!live) { const so = new Set(LS.get(K.s)); const bad = clean.find((i) => so.has(i.name)); if (bad) throw new Error(bad.name + ' is sold out today'); }
    const subtotal = clean.reduce((a, i) => a + i.price * i.qty, 0);
    const gst = Math.round(subtotal * (cfg.GST_RATE || 0.05));
    const o = { id: uid(), code: 'T' + t + '-' + shortCode(), table_no: t, customer_name: who, items: clean, note: (note || '').slice(0, 300), subtotal, gst, total: subtotal + gst, status: 'new', paid: false, paid_method: null, created_at: new Date().toISOString() };
    if (live) {
      let r; try { r = await sb.from('orders').insert({ id: o.id, code: o.code, table_no: o.table_no, customer_name: o.customer_name, items: o.items, note: o.note, subtotal: o.subtotal, gst: o.gst, total: o.total }); } catch (e) { throw friendly(e); }
      if (r.error) throw friendly(r.error);
    } else { const a = LS.get(K.o); a.unshift(o); LS.set(K.o, a); }
    return o;
  }

  async function reserve(r) {
    const row = { name: String(r.name || '').slice(0, 80), phone: String(r.phone || '').replace(/[^\d+]/g, '').slice(0, 15), date: r.date, time: r.time, guests: String(r.guests || '2'), note: String(r.note || '').slice(0, 300) };
    if (!row.name || row.phone.replace(/\D/g, '').length < 10 || !row.date || !row.time) throw new Error('Please fill in your name, a 10-digit phone number, date and time');
    if (live) ok(await sb.from('reservations').insert(row));
    else { const a = LS.get(K.r); a.unshift(Object.assign({ id: uid(), status: 'requested', created_at: new Date().toISOString() }, row)); LS.set(K.r, a); }
    return true;
  }

  async function soldOut() {
    if (live) return ok(await sb.from('menu_availability').select('name').eq('sold_out', true)).map(r => r.name);
    return LS.get(K.s);
  }

  /* ---------- staff ---------- */
  async function listOrders() {
    if (live) return ok(await sb.from('orders').select('*').gte('created_at', new Date(Date.now() - 36 * 3600e3).toISOString()).order('created_at', { ascending: false }));
    return LS.get(K.o);
  }
  async function orderHistory(fromISO, toISO) {
    if (live) return ok(await sb.from('orders').select('*').gte('created_at', fromISO).lt('created_at', toISO).order('created_at', { ascending: false }).limit(2000));
    return LS.get(K.o).filter(o => o.created_at >= fromISO && o.created_at < toISO);
  }
  async function updateOrder(id, patch) {
    if (live) return ok(await sb.from('orders').update(patch).eq('id', id));
    LS.set(K.o, LS.get(K.o).map(o => o.id === id ? Object.assign({}, o, patch) : o));
  }
  async function listReservations() {
    if (live) return ok(await sb.from('reservations').select('*').gte('date', new Date(Date.now() - 864e5).toISOString().slice(0, 10)).order('date').order('time'));
    return LS.get(K.r);
  }
  async function updateReservation(id, patch) {
    if (live) return ok(await sb.from('reservations').update(patch).eq('id', id));
    LS.set(K.r, LS.get(K.r).map(o => o.id === id ? Object.assign({}, o, patch) : o));
  }
  async function setSoldOut(name, out) {
    if (live) return ok(await sb.from('menu_availability').upsert({ name, sold_out: out, updated_at: new Date().toISOString() }));
    const s = new Set(LS.get(K.s)); out ? s.add(name) : s.delete(name); LS.set(K.s, [...s]);
  }
  function subscribe(cb) {
    if (live) {
      const ch = sb.channel('yelove-' + Math.random().toString(36).slice(2));
      ['orders', 'reservations', 'menu_availability'].forEach(t => ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, (p) => cb(t, p)));
      ch.subscribe();
      return () => sb.removeChannel(ch);
    }
    const h = (e) => { if (!e || !e.key || e.key.startsWith('yelove_')) cb(e && e.key === K.o ? 'orders' : e && e.key === K.r ? 'reservations' : 'menu_availability'); };
    addEventListener('storage', h);
    const iv = setInterval(() => cb('poll'), 4000);
    return () => { removeEventListener('storage', h); clearInterval(iv); };
  }

  /* ---------- staff login ---------- */
  async function signIn(email, password) {
    if (live) { ok(await sb.auth.signInWithPassword({ email, password })); return true; }
    if (password === (cfg.DEMO_PIN || '1234')) { sessionStorage.setItem('yelove_staff', '1'); return true; }
    throw new Error('Wrong PIN');
  }
  async function session() {
    if (live) { const { data } = await sb.auth.getSession(); return !!(data && data.session); }
    return sessionStorage.getItem('yelove_staff') === '1';
  }
  async function signOut() { if (live) await sb.auth.signOut(); sessionStorage.removeItem('yelove_staff'); }
  function resetDemo() { if (!live) Object.values(K).forEach(k => localStorage.removeItem(k)); }

  return { live, menuPrice, priceRows, syncPrices, placeOrder, reserve, soldOut, listOrders, orderHistory, updateOrder, listReservations, updateReservation, setSoldOut, subscribe, signIn, session, signOut, resetDemo };
})();

/* DHAAGA demo store: products, stock, bag and orders.
   shortcut: everything lives in this browser's localStorage, so orders placed on one device are only
   visible on that device. Move stock + orders to a real backend (e.g. Supabase) before going live. */
window.Store = (() => {
'use strict';
const K = {bag: 'dhaaga-bag-v2', stock: 'dhaaga-stock-v1', orders: 'dhaaga-orders-v1'};
const DELIVERY = 250, FREE_OVER = 5000;
const STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
const CITIES = ['Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad','Multan','Peshawar','Quetta','Hyderabad','Sialkot','Gujranwala','Other'];

/* ================= products (edit here) ================= */
const LINE = 'rgba(0,0,0,.14)';
const TOPS = ['S','M','L','XL'], WAIST = ['28','30','32','34','36'], SHOES = ['40','41','42','43','44','45'];
// shortcut: free Unsplash stock photos hotlinked as stand-ins; replace with your own product shoot before launch.
const U = id => `https://images.unsplash.com/photo-${id}?w=600&h=750&fit=crop&auto=format&q=70`;
const P = {
  'tee-white':    {desc:"The white tee you reach for first. Mid-weight cotton that keeps its shape, wash after wash.", name:'Essential Cotton Tee',  cat:'Plain Tee · 100% cotton',   kind:'tee',   color:'#f4f2ee', price:1990, img:U('1581655353564-df123a1eb820')},
  'tee-black':    {desc:"Same tee, darker mood. Deep black that stays black, with a collar that does not give up.", name:'Essential Tee — Black', cat:'Plain Tee · 100% cotton',   kind:'tee',   color:'#1f1f1f', price:1990, img:U('1610502778270-c5c6f4c7d575')},
  'oxford-blue':  {desc:"A proper Oxford in soft sky blue. Smart enough for the office, easy enough for Friday.", name:'Oxford Button-Down',    cat:'Plain Shirt · Oxford',      kind:'shirt', color:'#a9c3dd', price:3490, img:U('1602810316693-3667c854239a')},
  'linen-olive':  {desc:"Olive that goes with everything in your wardrobe. Soft cotton, relaxed through the body.", name:'Olive Cotton Tee',      cat:'Plain Tee · 100% cotton',   kind:'tee',   color:'#6f7a4f', price:2190, isNew:true, img:U('1523380677598-64d85d015339')},
  'poplin-sand':  {desc:"Crisp white poplin, cut clean. The shirt that makes any trouser look considered.", name:'Poplin Shirt — White',  cat:'Plain Shirt · Poplin',      kind:'shirt', color:'#ecebe6', price:3290, img:U('1603252109303-2751441dd157')},
  'chino-khaki':  {desc:"Straight-leg chino in cotton twill. Sits right between dressed up and dressed down.", name:'Straight Chino',        cat:'Trousers · Cotton twill',   kind:'pants', color:'#c2a878', price:3990}, // no good free photo yet: drawn placeholder
  'denim-blue':   {desc:"Relaxed denim in a mid-blue wash. Room to move, and it only gets better with wear.", name:'Relaxed Denim',         cat:'Trousers · Denim',          kind:'pants', color:'#5a7aa3', price:4490, img:U('1714143136372-ddaf8b606da7')},
  'trouser-char': {desc:"Slim black jeans with a little stretch. Sharp from the first wear, comfortable all day.", name:'Slim Black Jeans',      cat:'Trousers · Stretch denim',  kind:'pants', color:'#232326', price:4290, img:U('1718252540511-e958742e4165')},
  'sneaker-white':{desc:"A clean white leather sneaker with nothing extra on it. Goes with every look on the runway.", name:'Court Sneaker',         cat:'Shoes · Leather',           kind:'shoe',  color:'#f2f2f2', price:6490, style:'sneaker', img:U('1636262900147-fb56689b61c5')},
  'sneaker-black':{desc:"All-black leather sneaker. Quiet, tough, and hides a long day well.", name:'Black Leather Sneaker', cat:'Shoes · Leather',           kind:'shoe',  color:'#242424', price:5990, style:'sneaker', isNew:true, img:U('1632497775901-50ba4637399f')},
  'loafer-brown': {desc:"Hand-finished brown leather loafer. Slip on, look sorted.", name:'Leather Loafer',        cat:'Shoes · Leather',           kind:'shoe',  color:'#7a4e2d', price:7490, style:'loafer', img:U('1787166125913-1a9d9332ec8e')},
};
// items order: top, bottom, shoes (pins follow this order)
const LOOKS = [
  {name:'Karachi Weekend',   items:['tee-white','denim-blue','sneaker-white'],    skin:'#c68863', hair:'#1b1410'},
  {name:'Office in Lahore',  items:['oxford-blue','trouser-char','loafer-brown'], skin:'#a86f4c', hair:'#2a1d14'},
  {name:'Margalla Evenings', items:['linen-olive','chino-khaki','loafer-brown'],  skin:'#d9a07a', hair:'#120d0a'},
  {name:'All Black',         items:['tee-black','trouser-char','sneaker-black'],  skin:'#8d5a3b', hair:'#0d0907'},
  {name:'Clifton Breeze',    items:['poplin-sand','chino-khaki','sneaker-white'], skin:'#b97c57', hair:'#3a2618'},
  {name:'Everyday Denim',    items:['oxford-blue','denim-blue','sneaker-white'],  skin:'#e0ad86', hair:'#1b1410'},
];
const PIN = {tee:[50,33], shirt:[50,33], pants:[44,66], shoe:[38,96]};
const GROUP = {tee:'Tees', shirt:'Shirts', pants:'Trousers', shoe:'Shoes'};
// demo seed: most sizes have 8; the black sneaker starts sold out to show the state
const seedQty = (id, s) => id === 'sneaker-black' ? 0 : id === 'oxford-blue' && s === 'XL' ? 0 : 8;

const fmt = v => 'Rs ' + v.toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ================= faceless placeholder art ================= */
const uri = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;
function topParts(p) {
  const c = p.color, long = p.kind === 'shirt';
  const sl = long
    ? `<path d="M62 74 L47 120 L45 154 M118 74 L133 120 L135 154" stroke="${c}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
    : `<path d="M62 74 L50 108 M118 74 L130 108" stroke="${c}" stroke-width="19" stroke-linecap="round" fill="none"/>`;
  const detail = long
    ? `<path d="M90 76 V156" stroke="${LINE}"/>${[92,110,128,146].map(y=>`<circle cx="93" cy="${y}" r="1.4" fill="${LINE}"/>`).join('')}<path d="M80 63 L90 79 L84 60 Z M100 63 L90 79 L96 60 Z" fill="${c}" stroke="${LINE}"/>`
    : `<path d="M80 66 Q90 77 100 66" fill="none" stroke="${LINE}"/>`;
  return sl + `<path d="M60 70 Q90 62 120 70 L126 154 Q90 160 54 154 Z" fill="${c}" stroke="${LINE}"/>` + detail;
}
const pantsPath = c => `<path d="M57 146 H123 L121 308 H96 L90 182 L84 308 H59 Z" fill="${c}" stroke="${LINE}"/><path d="M90 150 V182 M57 152 H123" stroke="${LINE}"/>`;
function productImg(p) {
  if (p.img) return p.img;
  if (p.kind === 'pants') return uri(svg('22 140 136 170', pantsPath(p.color)));
  if (p.kind === 'shoe') {
    const c = p.color;
    return uri(svg('0 0 200 250', p.style === 'loafer'
      ? `<path d="M24 162 Q34 130 70 130 Q110 132 150 146 Q178 155 176 170 H26 Z" fill="${c}" stroke="${LINE}"/><path d="M88 138 Q110 140 126 150" fill="none" stroke="${LINE}" stroke-width="2"/><rect x="22" y="168" width="158" height="9" rx="4" fill="#3a2a1c"/>`
      : `<path d="M24 160 Q30 116 70 114 Q92 114 104 128 Q140 138 170 150 Q182 156 178 168 H26 Z" fill="${c}" stroke="${LINE}"/><path d="M76 122 l10 12 M88 125 l8 12 M100 129 l6 10" stroke="${LINE}" stroke-width="2"/><rect x="22" y="166" width="158" height="13" rx="6" fill="#fff" stroke="${LINE}"/>`));
  }
  return uri(svg('35 52 110 137.5', topParts(p)));
}
function figureImg(L) {
  const [t, b, s] = L.items.map(id => P[id]), sk = L.skin;
  const shoe = x => `<rect x="${x}" y="303" width="34" height="14" rx="7" fill="${s.color}" stroke="${LINE}"/>` +
    (s.style === 'sneaker' ? `<rect x="${x}" y="313" width="34" height="4" rx="2" fill="#fff" stroke="${LINE}"/>` : `<rect x="${x}" y="314" width="34" height="3" rx="1.5" fill="#3a2a1c"/>`);
  return uri(svg('0 0 180 320',
    `<path d="M62 74 L46 120 L44 160 M118 74 L134 120 L136 160" stroke="${sk}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    pantsPath(b.color) + shoe(52) + shoe(94) +
    `<rect x="83" y="48" width="14" height="20" fill="${sk}"/>` + topParts(t) +
    `<ellipse cx="90" cy="32" rx="16" ry="20" fill="${sk}"/><path d="M73 32 Q72 11 90 11 Q108 11 107 32 Q103 20 90 20 Q77 20 73 32 Z" fill="${L.hair}"/>`));
}
for (const id in P) { const p = P[id]; p.id = id; p.img = productImg(p); p.group = GROUP[p.kind];
  [p.legend, p.sizes] = p.kind === 'shoe' ? ['Shoe size (EU)', SHOES] : p.kind === 'pants' ? ['Waist', WAIST] : ['Size', TOPS]; }
LOOKS.forEach(L => { console.assert(L.items.every(id => P[id]), 'unknown product in look', L.name); L.img = figureImg(L); });

/* ================= storage ================= */
const get = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const emit = () => { renderCount(); dispatchEvent(new Event('store:change')); };
addEventListener('storage', e => { if (Object.values(K).includes(e.key)) emit(); }); // other tabs (e.g. admin) changed data

/* stock: {pid: {size: qty}} — stored values are validated, anything odd falls back to the seed */
function stock() {
  const raw = get(K.stock, {}), out = {};
  for (const id in P) { out[id] = {};
    for (const s of P[id].sizes) { const v = raw && raw[id] && raw[id][s]; out[id][s] = Number.isInteger(v) && v >= 0 && v <= 9999 ? v : seedQty(id, s); } }
  return out;
}
const qty = (pid, size) => (stock()[pid] || {})[size] || 0;
const available = pid => P[pid].sizes.some(s => qty(pid, s) > 0);
function setStock(pid, size, v) {
  if (!P[pid] || !P[pid].sizes.includes(size)) return;
  const st = stock(); st[pid][size] = Math.max(0, Math.min(9999, Math.floor(+v) || 0)); put(K.stock, st); emit();
}

/* bag: [{pid, size, qty}] */
function bag() {
  const v = get(K.bag, []);
  return Array.isArray(v) ? v.filter(x => x && P[x.pid] && P[x.pid].sizes.includes(x.size) && Number.isInteger(x.qty) && x.qty >= 1 && x.qty <= 20).slice(0, 50) : [];
}
// returns names that could not be added because stock ran out
function addToBag(items) {
  const b = bag(), failed = [];
  for (const {pid, size} of items) {
    const e = b.find(x => x.pid === pid && x.size === size), have = e ? e.qty : 0;
    if (have + 1 > Math.min(20, qty(pid, size))) { failed.push(P[pid].name); continue; }
    if (e) e.qty++; else b.push({pid, size, qty: 1});
  }
  put(K.bag, b); emit();
  return failed;
}
function setBagQty(i, q) {
  const b = bag(); if (!b[i]) return;
  if (q < 1) b.splice(i, 1); else b[i].qty = Math.min(q, 20, qty(b[i].pid, b[i].size));
  put(K.bag, b); emit();
}
const totals = (lines = bag()) => { const subtotal = lines.reduce((s, x) => s + P[x.pid].price * x.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_OVER ? 0 : DELIVERY; return {subtotal, delivery, total: subtotal + delivery}; };

/* orders */
const orders = () => { const v = get(K.orders, []); return Array.isArray(v) ? v.filter(o => o && o.id && Array.isArray(o.items)) : []; };
function placeOrder(customer) {
  const b = bag(); if (!b.length) throw new Error('Your bag is empty.');
  const st = stock();
  for (const x of b) if (st[x.pid][x.size] < x.qty)
    throw new Error(st[x.pid][x.size] ? `Only ${st[x.pid][x.size]} left of ${P[x.pid].name} (${x.size}). Please update your bag.` : `${P[x.pid].name} (${x.size}) just sold out. Please remove it from your bag.`);
  for (const x of b) st[x.pid][x.size] -= x.qty;
  const list = orders(), num = list.reduce((m, o) => Math.max(m, o.num || 0), 1000) + 1;
  const order = {id: 'DH-' + num, num, date: new Date().toISOString(), customer,
    items: b.map(x => ({pid: x.pid, name: P[x.pid].name, size: x.size, qty: x.qty, price: P[x.pid].price})),
    ...totals(b), payment: 'Cash on Delivery', status: 'Pending'};
  list.unshift(order);
  if (!put(K.orders, list)) throw new Error('Could not save your order in this browser. Please try again.');
  put(K.stock, st); put(K.bag, []); emit();
  return order;
}
function setStatus(id, status) {
  const list = orders(), o = list.find(x => x.id === id);
  if (!o || o.status === 'Cancelled' || !STATUSES.includes(status) || o.status === status) return;
  if (status === 'Cancelled') { const st = stock(); // put the pieces back on the shelf
    for (const it of o.items) if (st[it.pid] && it.size in st[it.pid]) st[it.pid][it.size] += it.qty; put(K.stock, st); }
  o.status = status; put(K.orders, list); emit();
}
function resetDemo() { [K.stock, K.orders, K.bag].forEach(k => { try { localStorage.removeItem(k); } catch {} }); emit(); }

/* ================= shared page chrome ================= */
const $ = (s, r = document) => r.querySelector(s);
let toastTimer = 0;
function toast(t) { const el = $('#bag-status'); if (!el) return; el.textContent = t; el.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600); }
function renderCount() { const c = bag().reduce((s, x) => s + x.qty, 0); document.querySelectorAll('[data-cart-count]').forEach(e => { e.textContent = c; e.dataset.cartCount = c; }); }
function renderBag() {
  const b = bag(), t = totals(b), box = $('#bag-items'); if (!box) return;
  box.innerHTML = b.length ? b.map((x, i) => { const p = P[x.pid], max = Math.min(20, qty(x.pid, x.size));
    return `<div class="bag-row"><img src="${p.img}" alt=""><div><h3>${esc(p.name)}</h3><p>${p.legend} ${x.size} · ${fmt(p.price)}</p>` +
      `<div class="qty"><button data-q="${i}" data-d="-1" aria-label="One less">−</button><span>${x.qty}</span><button data-q="${i}" data-d="1" aria-label="One more"${x.qty >= max ? ' disabled' : ''}>+</button></div></div>` +
      `<button class="bag-remove" data-q="${i}" data-d="-99" aria-label="Remove ${esc(p.name)}">×</button></div>`; }).join('')
    : '<p class="bag-note">Your bag is empty. Pick a size on any piece to add it.</p>';
  $('#bag-sums').innerHTML = b.length ? `<p class="bag-sum"><span>Subtotal</span><span>${fmt(t.subtotal)}</span></p>` +
    `<p class="bag-sum"><span>Delivery</span><span>${t.delivery ? fmt(t.delivery) : 'Free'}</span></p><p class="bag-sum total"><span>Total</span><span>${fmt(t.total)}</span></p>` : '';
  $('#go-checkout').disabled = !b.length;
}
const THEMES = ['white', 'forest', 'mint'], THEME_KEY = 'dhaaga-theme';
function setTheme(name) {
  if (!THEMES.includes(name)) name = THEMES[0];
  document.documentElement.dataset.theme = name;
  try { localStorage.setItem(THEME_KEY, name); } catch {}
  document.querySelectorAll('[data-theme-set]').forEach(b => b.setAttribute('aria-pressed', b.dataset.themeSet === name));
}
function mountChrome(active) {
  const top = $('#site-top'), cur = k => k === active ? ' aria-current="page"' : '';
  if (top) top.innerHTML = `<header class="nav"><a class="nav__mark" href="index.html" aria-label="DHAAGA home"><span lang="ur" dir="rtl">دھاگہ</span></a>
    <nav aria-label="Main navigation"><a href="index.html#shop"${cur('home')}>Shop</a><a href="runway.html"${cur('runway')}>Runway</a></nav>
    <button id="open-bag" aria-label="Open bag">Bag (<span data-cart-count>0</span>)</button>
    <div class="dots" role="group" aria-label="Colour theme">${THEMES.map(t => `<button data-theme-set="${t}" aria-label="${t} theme" aria-pressed="false"></button>`).join('')}</div></header>`;
  const foot = $('#site-foot');
  if (foot) foot.innerHTML = `<footer class="foot"><hr class="rule">
    <div class="foot__big"><p>Made in Pakistan.<br>Worn everywhere.</p><span aria-hidden="true">©26</span></div>
    <p class="foot__lead">Plain shirts, trousers and shoes in honest fabrics. No loud logos. Delivered anywhere in Pakistan, and you pay when it arrives.</p>
    <div class="foot__cols">
      <div><b>DHAAGA</b><p>All rights reserved © 2026</p></div>
      <div><p>Cash on Delivery<br>Free delivery over Rs 5,000<br>7-day size exchange</p></div>
      <div><a href="index.html#shop">Shop</a><a href="runway.html">Try the Look</a><a href="checkout.html">Checkout</a></div>
      <div><p>Delivery in 3–5 working days, nationwide</p></div>
      <div><p>Demo store. No real orders are fulfilled.</p></div>
    </div></footer>`;
  document.body.insertAdjacentHTML('beforeend', `<dialog id="bag-dialog" aria-labelledby="bag-title">
    <div class="bag-heading"><h2 id="bag-title">Bag</h2><button id="close-bag" aria-label="Close bag">×</button></div>
    <p class="bag-note">Pay in cash when your order arrives. Free delivery over Rs 5,000.</p>
    <div id="bag-items"></div><div id="bag-sums"></div>
    <button id="go-checkout" class="btn btn--block">Checkout</button></dialog>
    <div id="bag-status" role="status" aria-live="polite"></div>`);
  setTheme(document.documentElement.dataset.theme);
  if (top) top.addEventListener('click', e => { const d = e.target.closest('[data-theme-set]'); if (d) setTheme(d.dataset.themeSet); });
  const dlg = $('#bag-dialog');
  $('#open-bag')?.addEventListener('click', () => { renderBag(); dlg.showModal(); });
  $('#close-bag').addEventListener('click', () => dlg.close());
  $('#go-checkout').addEventListener('click', () => { location.href = 'checkout.html'; });
  dlg.addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) { const i = +q.dataset.q, b = bag(); if (b[i]) setBagQty(i, b[i].qty + +q.dataset.d); return; }
    const r = dlg.getBoundingClientRect();
    if (e.target === dlg && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dlg.close();
  });
  addEventListener('store:change', () => { if (dlg.open) renderBag(); });
  renderCount();
}

return {P, LOOKS, PIN, STATUSES, CITIES, FREE_OVER, DELIVERY, fmt, esc, stock, qty, available, setStock, bag, addToBag, setBagQty, totals,
  orders, placeOrder, setStatus, resetDemo, toast, mountChrome, openBag: () => $('#open-bag')?.click()};
})();

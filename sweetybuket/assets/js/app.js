/* ==========================================================================
   La Fleur — interactions
   Vanilla JS, no dependencies. Motion principles ported from MH Tutors
   (splash → page as one scene, mask text reveals, section rise, card
   stagger, image reveal, soft parallax, sheet slide, category crossfade).
   ========================================================================== */
(function () {
  'use strict';

  var D = window.LF_DATA, T = window.LF_TEXT;
  var doc = document.documentElement;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- analytics hook (ТЗ §71) ----------
     No analytics service is connected. Events go to window.dataLayer if a
     tag manager is ever added; otherwise they are simply ignored. */
  function track(event, data) {
    try {
      if (window.dataLayer && window.dataLayer.push) window.dataLayer.push(Object.assign({ event: event }, data || {}));
      if (typeof window.gtag === 'function') window.gtag('event', event, data || {});
    } catch (e) { /* never block the UI on tracking */ }
  }

  /* ---------- storage (per-browser convenience only) ---------- */
  var store = {
    get: function (k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var CART_KEY = 'sb_cart_v1', FORM_KEY = 'sb_checkout_v2';
  var paymentMethod = 'cash';

  /* ---------- lookups ---------- */
  var byId = {};
  D.PRODUCTS.forEach(function (p, i) { p.kind = 'product'; p.no = i + 1; p.image = p.image || p.id; byId[p.id] = p; });
  D.COMBOS.forEach(function (c) { c.kind = 'combo'; c.category = 'combo'; byId[c.id] = c; });
  var catById = {}; D.CATEGORIES.forEach(function (c) { catById[c.id] = c; });
  var occById = {}; D.OCCASIONS.forEach(function (o) { occById[o.id] = o; });

  function money(n) { return n == null ? T.onRequest : n === 0 ? T.free : fmt(n) + ' ' + T.currency; }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function unknownPrice() { return cart.some(function (l) { return l.price == null; }); }
  function sumText(n) { return unknownPrice() ? (n ? T.from + ' ' + fmt(n) + ' ' + T.currency : T.onRequest) : fmt(n) + ' ' + T.currency; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* Responsive picture from pre-cropped derivatives (scripts/sweety_assets.py).
     The crop is decided per photo at build time, so the frame ratio always
     equals the image ratio: object-fit never has to cut anything. */
  var CARD_SIZES = '(min-width: 1100px) 30vw, (min-width: 600px) 46vw, 92vw';
  function srcset(name, v, ext) {
    var ws = ((window.SB_IMG || {})[name] || {})[v] || [];
    return ws.map(function (w) { return 'assets/optimized/' + name + '-' + v + '-' + w + '.' + ext + ' ' + w + 'w'; }).join(', ');
  }
  function fallback(name, v) {
    var ws = ((window.SB_IMG || {})[name] || {})[v] || [800];
    var w = ws.filter(function (x) { return x <= 800; }).pop() || ws[0];
    return 'assets/optimized/' + name + '-' + v + '-' + w + '.jpg';
  }
  function picture(name, alt, opts) {
    opts = opts || {};
    var v = opts.v || 'card', sizes = opts.sizes || CARD_SIZES;
    return '<picture><source type="image/avif" srcset="' + srcset(name, v, 'avif') + '" sizes="' + sizes + '">' +
      '<source type="image/webp" srcset="' + srcset(name, v, 'webp') + '" sizes="' + sizes + '">' +
      '<img src="' + fallback(name, v) + '" srcset="' + srcset(name, v, 'jpg') + '" sizes="' + sizes + '" alt="' + esc(alt) + '"' +
      (opts.eager ? '' : ' loading="lazy"') + ' decoding="async" width="' + (opts.w || 800) + '" height="' + (opts.h || 1000) + '"></picture>';
  }
  /* broken images keep their frame and show a neutral fallback (ТЗ §69) */
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') { var f = t.closest('.frame, .occ, .col-img, .addon-img, .co-line-img, .ps-img, .story-img'); if (f) f.classList.add('frame', 'is-broken'); }
  }, true);

  /* ======================================================================
     CART STATE
     ====================================================================== */
  var cart = (store.get(CART_KEY, { lines: [] }).lines || []).filter(function (l) {
    if (l.type === 'addon') return !!D.ADDONS[l.id];
    return !!byId[l.id];
  }).map(function (l) {                       // always trust current prices
    l.price = l.type === 'addon' ? D.ADDONS[l.id].price : byId[l.id].price;
    return l;
  });

  function saveCart() { store.set(CART_KEY, { v: 2, lines: cart }); }
  function subtotal() { return cart.reduce(function (s, l) { return s + (l.price || 0) * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function lineName(l) { return l.type === 'addon' ? D.ADDONS[l.id].name : (l.type === 'combo' ? 'Набор «' + byId[l.id].name + '»' : byId[l.id].name); }
  function lineImage(l) { return l.type === 'addon' ? D.ADDONS[l.id].image : byId[l.id].image; }

  function addLine(type, id, card) {
    var key = type + ':' + id + (card ? ':' + card : '');
    var ex = cart.filter(function (l) { return l.key === key; })[0];
    if (ex) ex.qty++;
    else cart.push({ key: key, type: type, id: id, qty: 1, card: card || '', price: type === 'addon' ? D.ADDONS[id].price : byId[id].price });
  }
  function changeQty(key, d) {
    for (var i = 0; i < cart.length; i++) if (cart[i].key === key) {
      cart[i].qty += d;
      if (cart[i].qty <= 0) cart.splice(i, 1);
      break;
    }
    onCartChange();
  }
  function inCart(id) { return cart.some(function (l) { return l.id === id && l.type !== 'addon'; }); }

  function onCartChange(bump) {
    saveCart();
    var n = count();
    var hc = $('#hdrCart'), hn = $('#hdrCount'), bar = $('#cartbar');
    hc.hidden = n === 0;
    hn.textContent = n;
    if (bump) { hn.classList.remove('bump'); void hn.offsetWidth; hn.classList.add('bump'); }
    $('#cbCount').textContent = T.items(n);
    $('#cbSum').textContent = sumText(subtotal());
    if (n > 0) { bar.hidden = false; requestAnimationFrame(function () { bar.classList.add('is-on'); }); }
    else { bar.classList.remove('is-on'); setTimeout(function () { if (!count()) bar.hidden = true; }, 600); }
    document.body.classList.toggle('has-cart', n > 0);
    $$('.card[data-id]').forEach(function (c) { c.classList.toggle('in-cart', inCart(c.getAttribute('data-id'))); });
    if (!$('#coSheet').hidden) renderCheckout();
  }

  /* ======================================================================
     RENDER: occasions, collections, cards
     ====================================================================== */
  function renderOccasions() {
    var g = $('#occGrid');
    D.OCCASIONS.forEach(function (o, i) {
      var b = el('button', 'occ rv');
      b.type = 'button';
      b.style.setProperty('--sd', (i % 3) * 90 + 'ms');
      b.innerHTML = picture('occ-' + o.id, '', { v: 'v', sizes: '(min-width: 900px) 30vw, 46vw' }) +
        '<span class="occ-name">' + esc(o.name) + '<span class="occ-arrow">Смотреть →</span></span>';
      b.addEventListener('click', function () { selectOccasion(o.id); });
      g.appendChild(b);
    });
  }

  function catItems(cid) { return D.PRODUCTS.filter(function (p) { return p.category === cid; }); }

  function renderCollections() {
    var g = $('#colGrid');
    if (!g) return;
    var tiles = D.CATEGORIES.filter(function (c) { return c.tile; }).map(function (c) {
      var n = catItems(c.id).length;
      return { name: c.long || c.name, img: c.tile, n: n || T.soon, go: function () { selectCategory(c.id, true); } };
    });
    // the gift sets live in their own section further down
    if (D.COMBOS.length) tiles.splice(tiles.length - 1, 0, { name: 'Готовые подарки', img: D.COMBOS[0].image, n: D.COMBOS.length, go: function () { scrollToId('gifts'); } });
    tiles.forEach(function (t, i) {
      var b = el('button', 'col rv');
      b.type = 'button';
      b.style.setProperty('--sd', (i % 3) * 90 + 'ms');
      b.innerHTML = '<span class="col-img">' + picture(t.img, '', {}) + '</span>' +
        '<span class="col-meta"><span class="col-name">' + esc(t.name) + '</span></span>' +
        '<span class="col-count">' + t.n + '</span>';
      b.addEventListener('click', function () { track('category_selected', { category: t.name, source: 'collections' }); t.go(); });
      g.appendChild(b);
    });
  }

  function cardHTML(p) {
    var price = (p.oldPrice ? '<s>' + p.oldPrice + ' ' + T.currency + '</s>' : '') + money(p.price);
    var sub = '';
    var desc = p.kind === 'combo'
      ? '<ul class="combo-items">' + p.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'
      : '<p class="card-desc">' + esc(p.description) + '</p>';
    var save = p.oldPrice ? '<span class="combo-save">' + (p.kind === 'combo' ? T.wasPrice + ' ' + fmt(p.oldPrice) + ' ' + T.currency + ' · ' : '') + T.save(p.oldPrice - p.price) + '</span>' : '';
    var title = p.kind === 'combo' ? p.name.toUpperCase() : p.name;
    return '<span class="frame">' + (p.badge ? '<span class="card-badge">' + esc(p.badge) + '</span>' : '') +
      picture(p.image, p.kind === 'combo' ? 'Подарочный набор «' + p.name + '»: ' + p.description : 'Букет «' + p.name + '» — ' + p.description, {}) + '</span>' +
      sub + '<h3 class="card-name">' + esc(title) + '</h3>' + desc +
      '<span class="card-foot"><span><span class="price">' + price + '</span>' + (p.kind === 'combo' ? save : '') + '</span><span class="card-cta">' + T.choose + '</span></span>';
  }

  function makeCard(p, i, source) {
    // a div with button semantics: the card holds headings/lists, which a <button> may not contain
    var b = el('article', 'card rv' + (inCart(p.id) ? ' in-cart' : ''));
    b.tabIndex = 0;
    b.setAttribute('role', 'button');
    b.setAttribute('aria-label', (p.kind === 'combo' ? 'Набор ' : '') + p.name + ', ' + money(p.price));
    b.setAttribute('data-id', p.id);
    b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(p.id, source); } });
    b.style.setProperty('--sd', (i % 3) * 90 + 'ms');
    b.innerHTML = cardHTML(p);
    b.addEventListener('click', function () { openProduct(p.id, source); });
    return b;
  }

  /* signature: editorial rhythm, one large + two small, next row mirrored */
  function renderFeatured() {
    var g = $('#featGrid');
    if (!g) return;
    (D.FEATURED || []).map(function (id) { return byId[id]; }).filter(Boolean).forEach(function (p, i) {
      var c = makeCard(p, i, 'featured');
      c.classList.add(i % 3 === 0 ? 'is-lead' : 'is-side');
      g.appendChild(c);
    });
  }
  /* flowers + chocolate strawberries as one gift */
  function renderCombos() {
    var g = $('#giftGrid');
    if (!g) return;
    D.PRODUCTS.filter(function (p) { return p.category === 'combo' || p.category === 'sweets'; })
      .forEach(function (p, i) { g.appendChild(makeCard(p, i, 'gifts')); });
  }

  /* reels: muted loops that play only while on screen */
  function renderReels() {
    var box = document.getElementById('reelBox');
    if (!box || !D.REELS) return;
    D.REELS.forEach(function (r) {
      var f = el('figure', 'reel rv');
      f.innerHTML = '<video muted loop playsinline preload="none" poster="assets/video/' + r.file + '.jpg"><source src="assets/video/' + r.file + '.mp4" type="video/mp4"></video>' +
        '<figcaption class="reel-cap">' + esc(r.title) + '</figcaption>';
      box.appendChild(f);
    });
    var vids = $$('#reelBox video');
    if (reduced || !('IntersectionObserver' in window)) return;
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.play().catch(function () {}); } else e.target.pause(); });
    }, { threshold: 0.5 });
    vids.forEach(function (v) { vo.observe(v); });
  }

  /* ---------- catalog filtering ---------- */
  var filter = { cat: 'all', occ: null };

  function renderCatbar() {
    var bar = $('#catbarScroll');
    var cats = [{ id: 'all', name: T.allCats }].concat(D.CATEGORIES);
    cats.forEach(function (c) {
      var b = el('button', 'cat', esc(c.name));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('data-cat', c.id);
      b.setAttribute('aria-selected', c.id === filter.cat ? 'true' : 'false');
      b.addEventListener('click', function () { track('category_selected', { category: c.id, source: 'catbar' }); selectCategory(c.id, false); });
      bar.appendChild(b);
    });
  }

  function filtered() {
    return D.PRODUCTS.filter(function (p) {
      if (filter.cat !== 'all' && p.category !== filter.cat) return false;
      if (filter.occ && (!p.occasion || p.occasion.indexOf(filter.occ) === -1)) return false;
      return true;
    });
  }

  function renderGrid(animate) {
    var g = $('#grid');
    var draw = function () {
      g.innerHTML = '';
      var items = filtered();
      if (!items.length) {
        var emptyCat = filter.cat !== 'all' && !catItems(filter.cat).length;
        var e = el('div', 'empty', '<p>' + (emptyCat ? T.emptyCategory : T.emptyFilter) + '</p>');
        if (emptyCat) {
          var wa = el('a', 'btn btn-primary', T.writeUs);
          wa.href = 'https://t.me/+' + D.CHANNELS.telegram; wa.target = '_blank'; wa.rel = 'noopener';
          e.appendChild(wa);
        }
        var b = el('button', 'btn btn-ghost', T.showAll); b.type = 'button';
        b.addEventListener('click', function () { filter.occ = null; selectCategory('all', false); });
        e.appendChild(b); g.appendChild(e);
      }
      items.forEach(function (p, i) { g.appendChild(makeCard(p, i, 'catalog')); });
      // chip for the active occasion
      var chip = $('#occChip');
      if (filter.occ) {
        chip.hidden = false;
        chip.innerHTML = '<span>' + T.occasionChip + ':</span>';
        var x = el('button', '', esc(occById[filter.occ].name) + ' <span aria-hidden="true">×</span>');
        x.type = 'button'; x.setAttribute('aria-label', 'Сбросить повод ' + occById[filter.occ].name);
        x.addEventListener('click', function () { filter.occ = null; renderGrid(true); });
        chip.appendChild(x);
      } else chip.hidden = true;
      observeReveals(g);
    };
    if (!animate || reduced) { draw(); return; }
    g.classList.add('is-swapping');
    setTimeout(function () {
      draw();
      requestAnimationFrame(function () { g.classList.remove('is-swapping'); });
    }, 240);
  }

  function selectCategory(cid, scroll) {
    filter.cat = cid;
    $$('.cat').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-cat') === cid ? 'true' : 'false'); });
    var active = $('.cat[aria-selected="true"]');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
    renderGrid(true);
    if (scroll) scrollToId('catalog');
    else {
      var bar = $('#catbar');
      if (bar.getBoundingClientRect().top > parseInt(getComputedStyle(doc).getPropertyValue('--hdr-h'), 10) + 4) return;
      scrollToId('catalog');
    }
  }

  function selectOccasion(oid) {
    track('occasion_selected', { occasion: oid });
    filter.occ = oid;
    filter.cat = 'all';
    $$('.cat').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-cat') === 'all' ? 'true' : 'false'); });
    renderGrid(true);
    scrollToId('catalog');
  }

  function scrollToId(id) {
    var t = document.getElementById(id);
    if (!t) return;
    var top = t.getBoundingClientRect().top + window.pageYOffset - (id === 'catalog' ? 0 : 8);
    window.scrollTo({ top: Math.max(0, top - parseInt(getComputedStyle(doc).getPropertyValue('--hdr-h'), 10)), behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ======================================================================
     SHEETS (shared open/close, focus, scroll lock)
     ====================================================================== */
  var lastFocus = null;
  function openSheet(wrap) {
    lastFocus = document.activeElement;
    wrap.hidden = false;
    doc.classList.add('sheet-open');
    document.body.style.overflow = 'hidden';
    wrap.querySelector('.sheet-scroll').scrollTop = 0;
    requestAnimationFrame(function () { requestAnimationFrame(function () { wrap.classList.add('is-open'); }); });
    setTimeout(function () { var x = wrap.querySelector('.sheet-x'); if (x) x.focus({ preventScroll: true }); }, 50);
  }
  function closeSheet(wrap) {
    if (wrap.hidden) return;
    wrap.classList.remove('is-open');
    setTimeout(function () {
      wrap.hidden = true;
      if ($('#pSheet').hidden && $('#coSheet').hidden) { doc.classList.remove('sheet-open'); document.body.style.overflow = ''; }
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduced ? 200 : 560);
  }
  $$('.sheet-wrap').forEach(function (w) {
    w.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeSheet(w); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!$('#coSheet').hidden) closeSheet($('#coSheet'));
    else if (!$('#pSheet').hidden) closeSheet($('#pSheet'));
    else if (doc.classList.contains('menu-open')) toggleMenu(false);
  });
  // swipe the sheet down to close (mobile)
  $$('.sheet').forEach(function (s) {
    var y0 = null, dy = 0;
    s.addEventListener('touchstart', function (e) {
      var sc = s.querySelector('.sheet-scroll');
      y0 = (sc.scrollTop <= 0 && !e.target.closest('input, textarea, .addons, .slots, .days')) ? e.touches[0].clientY : null; dy = 0;
    }, { passive: true });
    s.addEventListener('touchmove', function (e) {
      if (y0 === null) return;
      dy = e.touches[0].clientY - y0;
      if (dy > 0) { s.style.transition = 'none'; s.style.transform = 'translateY(' + dy + 'px)'; }
    }, { passive: true });
    s.addEventListener('touchend', function () {
      if (y0 === null) return;
      s.style.transition = ''; s.style.transform = '';
      if (dy > 110) closeSheet(s.closest('.sheet-wrap'));
      y0 = null;
    });
  });

  /* ======================================================================
     PRODUCT SHEET
     ====================================================================== */
  var cur = null, curAddons = {};

  function openProduct(id, source) {
    var p = byId[id]; if (!p) return;
    cur = p; curAddons = {};
    track('product_opened', { id: id, source: source || '' });

    var img = $('#psImg');
    var ps = '(min-width: 768px) 60vw, 100vw';
    $('#psSrcAvif').srcset = srcset(p.image, 'card', 'avif'); $('#psSrcAvif').sizes = ps;
    $('#psSrcWebp').srcset = srcset(p.image, 'card', 'webp'); $('#psSrcWebp').sizes = ps;
    img.srcset = srcset(p.image, 'card', 'jpg'); img.sizes = ps;
    img.src = fallback(p.image, 'card');
    img.alt = p.kind === 'combo' ? 'Подарочный набор «' + p.name + '»' : 'Букет «' + p.name + '»';
    $('#psNo').textContent = p.kind === 'combo' ? 'Готовый подарок' : 'No. ' + pad(p.no);
    $('#psName').textContent = p.name;
    $('#psDesc').textContent = p.kind === 'combo' ? '' : p.description;
    $('#psDesc').hidden = p.kind === 'combo';
    var items = $('#psItems');
    items.hidden = p.kind !== 'combo';
    items.innerHTML = p.kind === 'combo' ? p.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '';
    $('#psPrice').innerHTML = (p.oldPrice ? '<s>' + fmt(p.oldPrice) + ' ' + T.currency + '</s>' : '') + money(p.price) +
      (p.oldPrice ? '<small>' + T.save(p.oldPrice - p.price) + '</small>' : '');

    // note card: bouquets and sets; the stand-alone "Открытка" gift opens with it on
    var isGift = p.category === 'gifts';
    var cardBlock = $('#psCardBlock'), cb = $('#psCard');
    cardBlock.hidden = isGift && p.id !== 'e4';
    cb.checked = p.id === 'e4' || (p.kind === 'combo' && p.card);
    cb.disabled = p.id === 'e4';
    $('#psCardText').value = '';
    $('#psCardWrap').hidden = !cb.checked;

    // add-ons: at most 3, the card is handled above
    var list = (p.addons || []).filter(function (a) { return !D.ADDONS[a].card; }).slice(0, 3);
    $('#psAddonsBlock').hidden = !list.length;
    var box = $('#psAddons'); box.innerHTML = '';
    list.forEach(function (aid) {
      var a = D.ADDONS[aid];
      var b = el('button', 'addon');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<span class="addon-img">' + picture(a.image, a.name, {}) + '</span><span class="addon-name">' + esc(a.short) + '</span><span class="addon-price">+' + money(a.price) + '</span>';
      b.addEventListener('click', function () {
        var on = !curAddons[aid];
        if (on) curAddons[aid] = true; else delete curAddons[aid];
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) track('addon_added', { id: aid, product: p.id });
        updateSheetSum();
      });
      box.appendChild(b);
    });

    $('#psAddLbl').textContent = T.addToCart;
    $('#psAdd').disabled = false;
    updateSheetSum();
    openSheet($('#pSheet'));
  }

  function updateSheetSum() {
    if (!cur) return;
    var s = cur.price || 0;
    for (var k in curAddons) s += D.ADDONS[k].price;
    $('#psSum').textContent = cur.price == null ? '' : '· ' + fmt(s) + ' ' + T.currency;
  }

  $('#psCard').addEventListener('change', function () {
    $('#psCardWrap').hidden = !this.checked;
    if (this.checked) setTimeout(function () { $('#psCardText').focus(); }, 60);
  });

  $('#psAdd').addEventListener('click', function () {
    if (!cur) return;
    var btn = this;
    var card = $('#psCard').checked ? ($('#psCardText').value.trim() || ' ') : '';
    addLine(cur.kind === 'combo' ? 'combo' : 'product', cur.id, card);
    for (var k in curAddons) addLine('addon', k);
    track('product_added', { id: cur.id, addons: Object.keys(curAddons), card: !!card });
    onCartChange(true);
    btn.disabled = true;
    $('#psAddLbl').textContent = T.added + ' ✓';
    note('«' + cur.name + '» — в корзине');
    setTimeout(function () { closeSheet($('#pSheet')); }, 650);
  });

  /* ======================================================================
     CHECKOUT
     ====================================================================== */
  /* Remember reusable checkout details on this device for repeat orders. */
  var form = store.get(FORM_KEY, {}) || {};
  var co = { mode: form.mode === 'p' ? 'p' : 'd', day: 0, slot: '' };
  ['fName', 'fPhone', 'fRName', 'fRPhone', 'fAddr'].forEach(function (fid) {
    var field = document.getElementById(fid);
    if (form[fid]) field.value = form[fid];
    field.addEventListener('input', function () {
      this.classList.remove('is-invalid'); form[fid] = this.value; store.set(FORM_KEY, form);
    });
  });
  document.getElementById('fComment').addEventListener('input', function () { this.classList.remove('is-invalid'); });
  $('#fConsent').addEventListener('change', function () { if (this.checked) $('#coErr').hidden = true; });

  function deliveryFee() { return !!D.DELIVERY && co.mode === 'd' && subtotal() > 0 && subtotal() < D.DELIVERY.freeFrom ? D.DELIVERY.fee : 0; }

  function setMode(m) {
    co.mode = m; form.mode = m; store.set(FORM_KEY, form);
    $('#modeD').setAttribute('aria-checked', m === 'd' ? 'true' : 'false');
    $('#modeP').setAttribute('aria-checked', m === 'p' ? 'true' : 'false');
    $('#fAddrWrap').hidden = m !== 'd';
    renderTotals();
  }
  $('#modeD').addEventListener('click', function () { setMode('d'); });
  $('#modeP').addEventListener('click', function () { setMode('p'); });
  $('#modeDNote').textContent = D.DELIVERY ? T.deliveryFee(D.DELIVERY.fee, D.DELIVERY.freeFrom) : T.deliveryShort;

  function renderTime() {
    var days = $('#days'), slots = $('#slots');
    days.innerHTML = ''; slots.innerHTML = '';
    [T.today, T.tomorrow].forEach(function (lbl, i) {
      var b = el('button', 'chip', lbl); b.type = 'button';
      b.setAttribute('aria-pressed', co.day === i ? 'true' : 'false');
      b.addEventListener('click', function () { co.day = i; co.slot = ''; renderTime(); });
      days.appendChild(b);
    });
    var now = new Date().getHours();
    D.SLOTS.forEach(function (s) {
      var b = el('button', 'chip', s); b.type = 'button';
      var off = co.day === 0 && parseInt(s, 10) <= now;   // same rule as the old site
      b.disabled = off;
      b.setAttribute('aria-pressed', co.slot === s ? 'true' : 'false');
      b.addEventListener('click', function () { co.slot = co.slot === s ? '' : s; renderTime(); });
      slots.appendChild(b);
    });
    var any = el('button', 'chip', T.anyTime); any.type = 'button';
    any.setAttribute('aria-pressed', co.slot === '?' ? 'true' : 'false');
    any.addEventListener('click', function () { co.slot = co.slot === '?' ? '' : '?'; renderTime(); });
    slots.appendChild(any);
  }

  function renderCheckout() {
    var ul = $('#coLines'); ul.innerHTML = '';
    if (!cart.length) ul.innerHTML = '<li class="co-empty">' + T.cartEmpty + '</li>';
    cart.forEach(function (l) {
      var li = el('li', 'co-line');
      var meta = l.type === 'addon' ? 'Дополнение' : (l.card ? T.cardFor + (l.card.trim() ? ': «' + esc(l.card.trim()) + '»' : '') : '');
      li.innerHTML = '<span class="co-line-img">' + picture(lineImage(l), '', {}) + '</span>' +
        '<span><span class="co-line-name">' + esc(lineName(l)) + '</span>' + (meta ? '<span class="co-line-meta">' + meta + '</span>' : '') + '</span>' +
        '<span class="co-line-side"><span class="co-line-price">' + money(l.price == null ? null : l.price * l.qty) + '</span><br>' +
        '<span class="qty"><button type="button" data-d="-1" aria-label="Меньше">−</button><span>' + l.qty + '</span><button type="button" data-d="1" aria-label="Больше">+</button></span></span>';
      li.querySelectorAll('.qty button').forEach(function (b) {
        b.addEventListener('click', function () {
          var d = +b.getAttribute('data-d');
          if (d < 0 && l.qty === 1 && !reduced) { li.classList.add('is-leaving'); setTimeout(function () { changeQty(l.key, d); }, 280); }
          else changeQty(l.key, d);
        });
      });
      ul.appendChild(li);
    });
    renderTotals();
  }

  function renderTotals() {
    var rows = '<div class="co-row"><span>Товары</span><span>' + sumText(subtotal()) + '</span></div>';
    if (co.mode === 'd') rows += '<div class="co-row"><span>' + T.delivery + '</span><span>' + (D.DELIVERY ? (deliveryFee() ? deliveryFee() + ' ' + T.currency : T.free) : T.deliveryAsk) + '</span></div>';
    $('#coRows').innerHTML = rows;
    $('#coSum').textContent = sumText(subtotal() + deliveryFee());
  }

  function openCheckout() {
    track('checkout_opened', { items: count(), total: subtotal() });
    $('#coErr').hidden = true;
    setMode(co.mode);
    renderTime();
    renderCheckout();
    closeSheet($('#pSheet'));
    openSheet($('#coSheet'));
  }
  $('#cartbarBtn').addEventListener('click', openCheckout);
  $('#hdrCart').addEventListener('click', openCheckout);
  $('#coClear').addEventListener('click', function () { cart = []; onCartChange(); note('Корзина очищена'); });

  function buildMessage() {
    var W = T.wa, v = function (id) { return document.getElementById(id).value.trim(); };
    var main = cart.filter(function (l) { return l.type !== 'addon'; });
    var extras = cart.filter(function (l) { return l.type === 'addon'; });
    var cards = main.filter(function (l) { return l.card; }).map(function (l) { return (l.card.trim() || '(текст уточню)') + (main.length > 1 ? ' — к «' + byId[l.id].name + '»' : ''); });
    var time = co.slot === '?' || !co.slot ? W.clarify : (co.day === 0 ? T.today : T.tomorrow) + ', ' + co.slot;
    var rname = v('fRName'), rphone = v('fRPhone');

    var m = [W.hello, ''];
    m.push(W.bouquet + ':');
    main.forEach(function (l) { m.push('• ' + lineName(l) + ' — ' + money(l.price) + (l.qty > 1 ? ' × ' + l.qty : '')); });
    m.push('', W.qty + ':', String(main.reduce(function (s, l) { return s + l.qty; }, 0)));
    m.push('', W.extra + ':');
    if (extras.length) extras.forEach(function (l) { m.push('• ' + lineName(l) + ' — ' + money(l.price) + (l.qty > 1 ? ' × ' + l.qty : '')); });
    else m.push(W.none);
    m.push('', W.card + ':', cards.length ? cards.join('\n') : W.none);
    m.push('', W.customer + ':', v('fName') + ', ' + v('fPhone'));
    m.push('', W.recipient + ':', rname || rphone ? [rname, rphone].filter(Boolean).join(', ') : W.none);
    m.push('', W.address + ':', co.mode === 'd' ? v('fAddr') : W.pickup);
    m.push('', W.time + ':', time);
    m.push('', W.comment + ':', v('fComment') || W.none);
    m.push('', 'Оплата:', paymentMethod === 'cash' ? 'Наличными' : paymentMethod === 'card' ? 'Безналичная' : 'Перевод');
    if ($('#fSurprise').checked) m.push('', '🤫 ' + W.surprise);
    if (co.mode === 'd' && D.DELIVERY) m.push('', W.deliveryLine + ': ' + (deliveryFee() ? deliveryFee() + ' ' + T.currency : T.free));
    m.push('', W.total + ':', unknownPrice() ? W.totalAsk : sumText(subtotal() + deliveryFee()));
    return m.join('\n');
  }

  $$('.pay-seg [data-pay]').forEach(function (b) {
    b.addEventListener('click', function () {
      paymentMethod = b.getAttribute('data-pay');
      $$('.pay-seg [data-pay]').forEach(function (x) {
        var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      var hint = $('#payHint');
      hint.textContent = paymentMethod === 'cash'
        ? 'Оплата наличными при получении. Детали подтвердит менеджер.'
        : paymentMethod === 'card'
          ? 'Безналичная оплата. Платёжную ссылку подключим здесь после настройки.'
          : 'Перевод. Реквизиты/платёжную ссылку подключим здесь после настройки.';
    });
  });

  $('#waBtn').addEventListener('click', function () {
    var err = $('#coErr');
    if (!cart.some(function (l) { return l.type !== 'addon'; })) {
      err.textContent = T.errEmpty; err.hidden = false; return;
    }
    var need = ['fName', 'fPhone'].concat(co.mode === 'd' ? ['fAddr'] : []);
    var bad = need.filter(function (id) { return !document.getElementById(id).value.trim(); });
    need.forEach(function (id) { document.getElementById(id).classList.toggle('is-invalid', bad.indexOf(id) > -1); });
    if (bad.length) {
      err.textContent = T.errRequired; err.hidden = false;
      var field = document.getElementById(bad[0]);
      field.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { field.focus({ preventScroll: true }); }, 350);
      return;
    }
    if (!$('#fConsent').checked) { err.textContent = T.errConsent; err.hidden = false; $('#fConsent').focus(); return; }
    err.hidden = true;
    var text = buildMessage();
    track('order_prepared', { total: subtotal() + deliveryFee(), items: count(), payment: paymentMethod });
    /* Completed website order: open the shop's exact Telegram chat and
       prefill the order. Telegram officially supports phone links with text. */
    var shopTelegram = '79165896600';
    var sendUrl = 'https://t.me/+' + shopTelegram + '?text=' + encodeURIComponent(text);
    track('order_channel', { channel: 'TelegramOrder', payment: paymentMethod });
    /* Mark the hand-off as completed before leaving the page. When the customer
       returns from Telegram the old basket must not look like a pending order. */
    cart = [];
    saveCart();
    onCartChange();
    /* Keep name, phone, recipient and address for the next order. */
    $('#fComment').value = '';
    $('#fConsent').checked = false;
    $('#fSurprise').checked = false;
    $('#coSend').hidden = false;
    var sentTitle = $('#coSend .co-send-ttl');
    var sentText = $('#coSend .co-send-txt');
    if (sentTitle) sentTitle.textContent = 'Заказ отправлен';
    if (sentText) sentText.textContent = 'Заказ передан в Telegram. Мы подтвердим наличие, доставку и оплату.';
    note('Заказ отправлен ✓');
    window.location.href = sendUrl;
  });

  function copyText(text) {
    try { navigator.clipboard.writeText(text).catch(function () {}); } catch (e) {}
  }

  /* Bouquet choice: self-service catalog or Telegram sales assistant */
  (function () {
    var trigger = $('#chooseBouquetBtn'), sheet = $('#chooseSheet');
    if (!trigger || !sheet) return;
    function closeChoose() { sheet.hidden = true; doc.classList.remove('sheet-open'); }
    trigger.addEventListener('click', function () { sheet.hidden = false; doc.classList.add('sheet-open'); });
    $('[data-choose-close]', sheet).forEach(function (x) { x.addEventListener('click', closeChoose); });
    var self = $('#chooseSelf');
    if (self) self.addEventListener('click', function (e) {
      e.preventDefault(); closeChoose();
      setTimeout(function () { scrollToId('catalog'); }, 50);
    });
  })();

  /* ======================================================================
     QUIET STATUS NOTE
     ====================================================================== */
  var noteT;
  function note(msg) {
    var n = $('#note');
    n.textContent = msg;
    n.classList.add('is-on');
    clearTimeout(noteT);
    noteT = setTimeout(function () { n.classList.remove('is-on'); }, 2600);
  }

  /* ======================================================================
     HEADER + MENU
     ====================================================================== */
  function toggleMenu(open) {
    var m = $('#menu'), btn = $('#menuBtn');
    if (open) {
      m.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { m.classList.add('is-open'); }); });
      doc.classList.add('menu-open');
    } else {
      m.classList.remove('is-open');
      doc.classList.remove('menu-open');
      setTimeout(function () { if (!m.classList.contains('is-open')) m.hidden = true; }, reduced ? 200 : 700);
    }
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.hdr-menu-lbl').textContent = open ? 'Закрыть' : 'Меню';
  }
  $('#menuBtn').addEventListener('click', function () { toggleMenu(!doc.classList.contains('menu-open')); });
  $$('[data-nav]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-nav');
      var wasOpen = doc.classList.contains('menu-open');
      if (wasOpen) toggleMenu(false);
      setTimeout(function () { id === 'top' ? window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }) : scrollToId(id); }, wasOpen ? 380 : 0);
    });
  });
  $$('[data-wa-link]').forEach(function (a) { a.remove(); });
  /* seller details in the footer (required for distance selling) */
  (function () {
    var L = D.LEGAL || {}, s = $('#sellerInfo');
    if (!s) return;
    var parts = [L.seller || 'Продавец: сведения уточняются'];
    if (L.inn) parts.push('ИНН ' + L.inn);
    if (L.ogrnip) parts.push('ОГРНИП ' + L.ogrnip);
    if (L.address) parts.push(L.address);
    if (L.email) parts.push(L.email);
    s.textContent = parts.join(' · ');
  })();

  var hdr = $('#hdr');
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      hdr.classList.toggle('is-compact', window.pageYOffset > 40);
      hdr.classList.toggle('is-over', window.pageYOffset < 40);
      parallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* soft parallax, 3% of the frame, editorial image only */
  var px = $('.brand-media picture');
  if (px && !reduced) { px.setAttribute('data-parallax', ''); px.style.display = 'block'; }
  function parallax() {
    if (!px || reduced) return;
    var r = px.parentNode.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);   // −0.5 … 0.5
    px.style.transform = 'translate3d(0,' + (p * r.height * 0.06).toFixed(1) + 'px,0) scale(1.07)';
  }

  /* ======================================================================
     SCROLL REVEALS (one-shot, not repeated on scroll back — ТЗ §31)
     ====================================================================== */
  function splitLines(node) {
    var parts = node.innerHTML.split(/<br\s*\/?>/i);
    node.innerHTML = parts.map(function (h, i) {
      return '<span class="mask"><span class="mask-in" style="--i:' + i + '">' + h.trim() + '</span></span>';
    }).join('<br>');
  }
  $$('[data-reveal-text]').forEach(splitLines);

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
  var revealsLive = false;

  function observeReveals(root) {
    var nodes = $$('[data-reveal], [data-reveal-text], [data-reveal-img], [data-stagger], .rv', root || document)
      .filter(function (n) { return !n.classList.contains('is-in'); });
    if (!io || !revealsLive) { if (!io) nodes.forEach(function (n) { n.classList.add('is-in'); }); return; }
    var vh = window.innerHeight;
    nodes.forEach(function (n) {
      var r = n.getBoundingClientRect();
      // already on screen at mount: reveal now instead of waiting on the observer
      if (r.top < vh * 0.96 && r.bottom > 0) requestAnimationFrame(function () { n.classList.add('is-in'); });
      else io.observe(n);
    });
  }
  function startReveals() { revealsLive = true; observeReveals(); }

  /* ======================================================================
     OPENING: wine panels part (~2 s) and the hero is already behind them.
     Once per session (sessionStorage), skipped on any interaction.
     ====================================================================== */
  var opening = $('#opening'), hero = $('.hero');
  var opened = false;

  function openPage() {
    if (opened) return; opened = true;
    try { sessionStorage.setItem('sb_intro', '1'); } catch (e) {}
    doc.classList.remove('intro-pending');
    doc.classList.add('intro-leaving');
    opening.classList.add('is-open');
    hero.classList.add('is-in');                         // hero text rises as the panels part
    setTimeout(startReveals, reduced ? 0 : 500);
    setTimeout(function () { doc.classList.remove('intro-leaving'); doc.classList.add('intro-done'); }, reduced ? 350 : 1150);
  }

  function initOpening() {
    if (!doc.classList.contains('intro-pending')) { hero.classList.add('is-in'); startReveals(); return; }
    window.scrollTo(0, 0);
    requestAnimationFrame(function () { requestAnimationFrame(function () { opening.classList.add('is-in'); }); });
    var t = setTimeout(openPage, reduced ? 500 : 1250);
    var skip = function () { clearTimeout(t); openPage(); };
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) { window.addEventListener(ev, skip, { once: true, passive: true }); });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  $('#delNote').textContent = T.deliveryNote;
  renderOccasions();
  renderCollections();
  renderFeatured();
  renderCatbar();
  renderGrid(false);
  renderCombos();
  renderReels();
  onCartChange();
  window.LF_READY = true;
  initOpening();
})();

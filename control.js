(function () {
  'use strict';
  const D = window.SITE_DATA, C = window.Chalkroom;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const root = document.documentElement, body = document.body;
  const money = n => '$' + n.toFixed(2);
  const go = view => { if (location.hash.slice(1) !== view) location.hash = view; };

  /* ---------- Appearance: colors, modes, background scenes ---------- */
  function toColor(w) { // lets the browser decide whether a word is a real CSS color
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#010203'; c.fillStyle = w; const a = c.fillStyle;
    c.fillStyle = '#040506'; c.fillStyle = w; const b = c.fillStyle;
    return a === b ? a : null;
  }
  function setBoard(hex) {
    const n = parseInt(hex.slice(1), 16), light = (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.6;
    root.style.setProperty('--board', hex); root.style.setProperty('--chalk', light ? '#161616' : '#f4f3ee');
    root.style.setProperty('--dim', light ? '#444444' : '#b9b8b0'); root.style.setProperty('--rule', light ? '#9a9a94' : '#4a4a46');
  }
  function useColor(hex) { setBoard(hex); body.style.backgroundImage = 'none'; body.classList.remove('scene'); store.set('chalk-look', { color: hex }); }
  function useScene(name) {
    setBoard('#101010'); body.style.backgroundImage = D.scenes[name]; body.style.backgroundSize = 'cover'; body.style.backgroundAttachment = 'fixed';
    body.classList.add('scene'); store.set('chalk-look', { scene: name });
  }
  function resetLook() {
    ['--board', '--chalk', '--dim', '--rule'].forEach(p => root.style.removeProperty(p));
    ['backgroundImage', 'backgroundSize', 'backgroundAttachment'].forEach(p => body.style[p] = ''); body.classList.remove('scene'); store.set('chalk-look', {});
  }
  const saved = store.get('chalk-look', {});
  if (saved.scene && D.scenes[saved.scene]) useScene(saved.scene); else if (saved.color) useColor(saved.color);

  /* ---------- Assignments view ---------- */
  const asgList = $('#asg-list');
  D.assignments.forEach(a => {
    const d = el('details', 'card'); d.id = 'asg-' + a.n;
    d.append(el('summary', '', `Assignment ${a.n}: ${a.title}`), el('p', '', a.summary), el('p', 'hint', a.explain));
    if (a.link) { const l = el('a', '', a.link[0] === '#' ? 'Open this section' : 'Open this page'); l.href = a.link; d.append(l); }
    asgList.append(d);
  });
  function showAssignment(a) {
    go('assignments');
    document.querySelectorAll('#asg-list details').forEach(d => { d.classList.remove('pick'); d.open = false; });
    const d = $('#asg-' + a.n); d.open = true; d.classList.add('pick');
    setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }

  /* ---------- Shop view and cart ---------- */
  let cart = store.get('chalk-cart', []), shown = [];
  const grid = $('#shop-grid'), cartList = $('#cart-list'), navShop = $('#nav-shop');
  const prod = id => D.products.find(p => p.id === id);
  const STOP = new Set('a an the me my for find search show look looking need want buy get please i some any to of on in product products shop store can you could would like all add it one is are'.split(' '));
  const tokens = t => t.split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(w => w.replace(/s$/, ''));
  function findProducts(t) {
    const tk = tokens(t); if (!tk.length) return D.products.slice();
    const sc = D.products.map(p => { const h = (p.name + ' ' + p.tags).toLowerCase(); return [p, tk.filter(w => h.includes(w)).length]; });
    const top = Math.max(...sc.map(x => x[1])); return top ? sc.filter(x => x[1] === top).map(x => x[0]) : [];
  }
  function renderShop() {
    grid.textContent = '';
    if (!shown.length) grid.append(el('p', 'hint', 'No products match. Try "keyboard", "headphones", or "backpack".'));
    shown.forEach((p, i) => {
      const c = el('article', 'card'); c.append(el('h3', '', `${i + 1}. ${p.name}`), el('p', '', money(p.price)));
      const b = el('button', 'btn', 'Add to cart'); b.type = 'button'; b.addEventListener('click', () => addToCart(p)); c.append(b); grid.append(c);
    });
    cartList.textContent = ''; let total = 0, count = 0;
    cart.forEach((x, i) => { const p = prod(x.id); total += p.price * x.qty; count += x.qty;
      const li = el('li', '', `${i + 1}. ${p.name} × ${x.qty} (${money(p.price * x.qty)})`); cartList.append(li); });
    if (!cart.length) cartList.append(el('li', 'hint', 'Your cart is empty.'));
    $('#cart-total').textContent = 'Total: ' + money(total); navShop.textContent = count ? `Shop (${count})` : 'Shop';
  }
  function addToCart(p) { const x = cart.find(c => c.id === p.id); if (x) x.qty++; else cart.push({ id: p.id, qty: 1 }); store.set('chalk-cart', cart); renderShop(); return `Added ${p.name} to your cart.`; }
  $('#shop-form').addEventListener('submit', e => { e.preventDefault(); shown = findProducts(C.clean($('#shop-q').value).toLowerCase()); renderShop(); });
  $('#cart-clear').addEventListener('click', () => { cart = []; store.set('chalk-cart', cart); renderShop(); });
  shown = D.products.slice(); renderShop();

  /* ---------- Understanding commands ---------- */
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };
  function ordinal(t, len) {
    if (/\blast\b/.test(t)) return len;
    const w = t.match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\b/); if (w) return ORD[w[1]];
    const n = t.match(/(?:number|item|product|result|option|#)\s*(\d+)/); return n ? +n[1] : 0;
  }
  const scenes = Object.keys(D.scenes);
  const NAV = /\b(go|return|back|take|open|show|switch|navigate|bring)\b/;
  const asgByNumber = t => { const m = t.match(/(?:assignment|project)\s*(?:number\s*)?(\d+)|#(\d+)/); return m ? D.assignments.find(a => a.n === +(m[1] || m[2])) : null; };
  const asgByWords = t => { let best = null, s = 0; D.assignments.forEach(a => { const c = a.kw.filter(k => t.includes(k)).length; if (c > s) { s = c; best = a; } }); return /\b(project|assignment)\b/.test(t) ? best : null; };

  const INTENTS = [
    t => /\b(help|what can you do|commands)\b/.test(t) && 'I can control this site. Try:\n• "Change the background to blue"\n• "Switch to dark mode" or "light mode"\n• "Change the background image to a beach" (also sunset, forest, space, mountains)\n• "Show me all my assignments"\n• "Open my data analysis project"\n• "Explain Assignment 5"\n• "Find a wireless keyboard"\n• "Add the second product to my cart"\n• "Return to the homepage"\nI also answer school questions, like "how do I add fractions?"',
    t => { // cart
      if (!/\b(cart|basket)\b/.test(t)) return null;
      if (/\b(clear|empty)\b/.test(t)) { cart = []; store.set('chalk-cart', cart); renderShop(); return 'Your cart is empty.'; }
      if (/\b(checkout|check out|pay)\b/.test(t)) return 'This is a demo store, so there is no real checkout. Your cart total is shown on the Shop page.';
      if (/\b(remove|delete|take)\b/.test(t)) { const i = ordinal(t, cart.length); const x = cart[i - 1]; if (!x) return 'Tell me which cart item to remove, like "remove the first item from my cart".'; cart.splice(i - 1, 1); store.set('chalk-cart', cart); renderShop(); return `Removed ${prod(x.id).name} from your cart.`; }
      if (/\b(add|put)\b/.test(t)) {
        const i = ordinal(t, shown.length);
        if (i) { const p = shown[i - 1]; return p ? addToCart(p) : `There is no product number ${i} in the current results (${shown.length} shown).`; }
        const m = findProducts(t); if (m.length && m.length < D.products.length) return addToCart(m[0]) + (m.length > 1 ? ' (I picked the first match. Say "second" to choose another.)' : '');
        return 'Which product? Search first, then say "add the second product to my cart".';
      }
      go('shop'); return `Your cart has ${cart.reduce((s, x) => s + x.qty, 0)} item(s). Opening the Shop page.`;
    },
    t => { // product search
      const words = tokens(t), matches = D.products.some(p => words.some(w => (p.name + ' ' + p.tags).toLowerCase().includes(w)));
      const verb = /\b(find|search|look|looking|buy|shop|need|want|get|show|browse)\b/.test(t);
      if (!(verb && matches) && !/\b(shop|store|products)\b/.test(t)) return null;
      if (/\b(go|open|take)\b/.test(t) && !matches) { go('shop'); return 'Opening the Shop.'; }
      shown = findProducts(t); go('shop'); renderShop();
      return shown.length ? `Found ${shown.length} product(s):\n` + shown.map((p, i) => `${i + 1}. ${p.name} (${money(p.price)})`).join('\n') + '\nSay "add the second product to my cart" to buy one.' : 'I found nothing like that. Try "keyboard", "headphones", or "backpack".';
    },
    t => { // appearance
      if (/\b(reset|default|original)\b/.test(t) && /\b(theme|look|background|colors?|colours?|site|everything)\b/.test(t)) { resetLook(); return 'Appearance reset to the blackboard.'; }
      const sc = scenes.find(s => t.includes(s) || (s === 'mountains' && t.includes('mountain')));
      if (sc && /\b(background|image|picture|photo|wallpaper|scene|backdrop|theme|change|make)\b/.test(t)) { useScene(sc); return `Background changed to a ${sc} scene.`; }
      if (/\b(image|picture|photo|wallpaper|scene)\b/.test(t) && /\b(background|change|set|switch)\b/.test(t)) return 'I have these backgrounds: ' + scenes.join(', ') + '. Which one?';
      if (/(dark|night) (mode|theme)|blackboard( mode)?\b|\bgo dark\b/.test(t)) { useColor('#101010'); return 'Switched to dark mode, the blackboard.'; }
      if (/(light|day) (mode|theme)|whiteboard|\bgo light\b/.test(t)) { useColor('#f6f5f0'); return 'Switched to light mode, the whiteboard.'; }
      if (/\b(background|backdrop|colou?r|website|site|page|board)\b/.test(t) && /\b(change|make|set|turn|switch|paint)\b/.test(t)) {
        const ws = (t.match(/#[0-9a-f]{3,6}\b|[a-z]+/g) || []).reverse();
        for (const w of ws) { if (['dark', 'light', 'color', 'colour', 'background', 'page', 'site', 'website', 'board'].includes(w)) continue;
          const hex = (/\b(dark|light)\b/.test(t) && toColor((/dark/.test(t) ? 'dark' : 'light') + w)) || toColor(w);
          if (hex) { useColor(hex); return `Background changed to ${w}.`; } }
        return 'I did not recognize that as a color or scene. Try a color like blue or purple, or a scene: ' + scenes.join(', ') + '.';
      }
      return null;
    },
    t => { // assignments
      const num = asgByNumber(t), kw = asgByWords(t), a = num || kw;
      if (/\b(explain|describe|summarize|tell me about)\b/.test(t) && a) { showAssignment(a); return a.explain; }
      if (a && NAV.test(t)) { showAssignment(a); return `Opening Assignment ${a.n}: ${a.title}.`; }
      if (/\b(assignments|projects)\b/.test(t) && (/\b(all|every|list|my)\b/.test(t) || NAV.test(t))) { go('assignments'); document.querySelectorAll('#asg-list details').forEach(d => d.classList.remove('pick')); return 'Here are all your assignments:\n' + D.assignments.map(x => `${x.n}. ${x.title}`).join('\n'); }
      return null;
    },
    t => { // navigation
      if (!NAV.test(t) && t !== 'home') return null;
      if (/\b(home|homepage|main page|start page)\b/.test(t) || t === 'home') { go(''); return 'Back on the homepage.'; }
      if (/\b(idea|about chalkroom|about the site)\b/.test(t)) { go('idea'); return 'Opening the idea page.'; }
      if (/\b(team|assistants|tutors)\b/.test(t)) { go('team'); return 'Opening the team of assistants.'; }
      return null;
    },
    t => /\b(play|pause|resume|music|song|movie|video|film)\b/.test(t) && 'Music and movie controls are not on the site yet. They are coming in a later update.'
  ];
  function run(text) {
    const t = C.clean(text).toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    for (const f of INTENTS) { const r = f(t); if (r) return r; }
    return null;
  }
  window.Control = { run };

  /* ---------- Chat panel on every page, with voice ---------- */
  const fab = el('button', 'btn', 'Control'); fab.id = 'ctl-fab'; fab.type = 'button'; fab.setAttribute('aria-expanded', 'false');
  const panel = el('aside'); panel.id = 'ctl'; panel.hidden = true; panel.setAttribute('aria-label', 'Site control chat');
  const log = el('div', 'log'); log.setAttribute('aria-live', 'polite');
  const form = el('form'), inp = el('input'), send = el('button', 'btn', 'Send'); inp.maxLength = 200; inp.setAttribute('aria-label', 'Type a command'); inp.placeholder = 'Type or say a command';
  form.append(inp, send); panel.append(el('h3', '', 'Control the site'), log, form); body.append(fab, panel);
  const add = (t, me) => { const m = el('div', 'm' + (me ? ' me' : ''), t); log.append(m); log.scrollTop = log.scrollHeight; };
  function handle(q) {
    q = C.clean(q); if (!q) return; add(q, true);
    let r = run(q);
    if (!r) { const [a] = C.best(q); r = a ? `${a.name} (${a.subject}): ${C.reply(a, q).text}` : 'I did not catch a command or a school question. Say "help" to see what I can do.'; }
    add(r);
  }
  add('Hi, I run this site. Tell me what to do, like "change the background to a beach" or "find a wireless keyboard." Say "help" for more.');
  form.addEventListener('submit', e => { e.preventDefault(); const v = inp.value; inp.value = ''; handle(v); });
  fab.addEventListener('click', () => { panel.hidden = !panel.hidden; fab.setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) inp.focus(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; fab.focus(); } });
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const mic = el('button', 'btn alt', 'Speak'); mic.type = 'button'; mic.setAttribute('aria-label', 'Speak a command'); form.append(mic);
    mic.addEventListener('click', () => {
      const r = new SR(); r.lang = 'en-US'; r.interimResults = false; mic.classList.add('live'); mic.textContent = 'Listening';
      r.onresult = e => handle(e.results[0][0].transcript);
      r.onerror = e => add(`The microphone did not work (${e.error}). You can type instead.`);
      r.onend = () => { mic.classList.remove('live'); mic.textContent = 'Speak'; };
      try { r.start(); } catch (e) { r.onend(); }
    });
  } else add('Voice input is not supported in this browser. Typing works everywhere.');
})();

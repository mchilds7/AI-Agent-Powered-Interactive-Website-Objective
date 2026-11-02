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

  /* =========================================================
     WEBSITE FUNCTIONS (the "tools"). Each does one job on the page,
     then checks the page itself to confirm it worked.
     ========================================================= */
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
  const boardNow = () => getComputedStyle(root).getPropertyValue('--board').trim().toLowerCase();
  function paintColor(hex) { setBoard(hex); body.style.backgroundImage = 'none'; body.classList.remove('scene'); store.set('chalk-look', { color: hex }); }
  function paintScene(name) {
    setBoard('#101010'); body.style.backgroundImage = D.scenes[name]; body.style.backgroundSize = 'cover'; body.style.backgroundAttachment = 'fixed';
    body.classList.add('scene'); store.set('chalk-look', { scene: name });
  }
  const saved = store.get('chalk-look', {});
  if (saved.scene && D.scenes[saved.scene]) paintScene(saved.scene); else if (saved.color) paintColor(saved.color);

  // Assignments page
  const asgList = $('#asg-list');
  D.assignments.forEach(a => {
    const d = el('details', 'card'); d.id = 'asg-' + a.n;
    d.append(el('summary', '', `Assignment ${a.n}: ${a.title}`), el('p', '', a.summary), el('p', 'hint', a.explain));
    if (a.link) { const l = el('a', '', a.link[0] === '#' ? 'Open this section' : 'Open this page'); l.href = a.link; d.append(l); }
    asgList.append(d);
  });
  function reveal(a) {
    go('assignments');
    document.querySelectorAll('#asg-list details').forEach(d => { d.classList.remove('pick'); d.open = false; });
    const d = $('#asg-' + a.n); d.open = true; d.classList.add('pick');
    setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
    return d.open;
  }

  // Shop and cart
  let cart = store.get('chalk-cart', []), shown = D.products.slice();
  const grid = $('#shop-grid'), cartList = $('#cart-list'), navShop = $('#nav-shop');
  const prod = id => D.products.find(p => p.id === id);
  const STOP = new Set('a an the me my for find search show look looking need want buy get please i some any to of on in product products shop store can you could would like all add it one is are'.split(' '));
  const tokens = t => t.split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(w => w.replace(/s$/, ''));
  function findProducts(t) {
    const tk = tokens(t); if (!tk.length) return D.products.slice();
    const sc = D.products.map(p => { const h = (p.name + ' ' + p.tags).toLowerCase(); return [p, tk.filter(w => h.includes(w)).length]; });
    const top = Math.max(...sc.map(x => x[1])); return top ? sc.filter(x => x[1] === top).map(x => x[0]) : [];
  }
  const qty = id => (cart.find(c => c.id === id) || { qty: 0 }).qty;
  function renderShop() {
    grid.textContent = '';
    if (!shown.length) grid.append(el('p', 'hint', 'No products match. Try "keyboard", "headphones", or "backpack".'));
    shown.forEach((p, i) => {
      const c = el('article', 'card'); c.append(el('h3', '', `${i + 1}. ${p.name}`), el('p', '', money(p.price)));
      const b = el('button', 'btn', 'Add to cart'); b.type = 'button'; b.addEventListener('click', () => { Tools.addToCart({ p }); }); c.append(b); grid.append(c);
    });
    cartList.textContent = ''; let total = 0, count = 0;
    cart.forEach((x, i) => { const p = prod(x.id); total += p.price * x.qty; count += x.qty; cartList.append(el('li', '', `${i + 1}. ${p.name} × ${x.qty} (${money(p.price * x.qty)})`)); });
    if (!cart.length) cartList.append(el('li', 'hint', 'Your cart is empty.'));
    $('#cart-total').textContent = 'Total: ' + money(total); navShop.textContent = count ? `Shop (${count})` : 'Shop';
  }
  const saveCart = () => { store.set('chalk-cart', cart); renderShop(); };
  $('#shop-form').addEventListener('submit', e => { e.preventDefault(); shown = findProducts(C.clean($('#shop-q').value).toLowerCase()); renderShop(); });
  $('#cart-clear').addEventListener('click', () => { cart = []; saveCart(); });
  renderShop();

  // Media players
  const players = { music: $('#m-audio'), movie: $('#m-video') };
  ['music', 'movie'].forEach(k => { if (D.media && D.media[k]) players[k].setAttribute('src', D.media[k]); });
  const loaded = k => !!players[k].getAttribute('src');
  let lastKind = null;

  const Tools = {
    // Theme functions
    setColor({ hex, name }) { paintColor(hex); const v = boardNow(); return { ok: v === hex, say: `Background changed to ${name}.`, check: `the page background is now ${v}` }; },
    setScene({ name }) { paintScene(name); const ok = body.style.backgroundImage.includes('gradient'); return { ok, say: `Background changed to a ${name} scene.`, check: `the ${name} scene is applied to the page` }; },
    setMode({ mode }) { const hex = mode === 'dark' ? '#101010' : '#f6f5f0'; paintColor(hex); return { ok: boardNow() === hex, say: mode === 'dark' ? 'Switched to dark mode, the blackboard.' : 'Switched to light mode, the whiteboard.', check: `the board color is ${boardNow()}` }; },
    resetLook() { ['--board', '--chalk', '--dim', '--rule'].forEach(p => root.style.removeProperty(p)); ['backgroundImage', 'backgroundSize', 'backgroundAttachment'].forEach(p => body.style[p] = ''); body.classList.remove('scene'); store.set('chalk-look', {}); return { ok: !body.classList.contains('scene'), say: 'Appearance reset to the blackboard.', check: 'default theme restored' }; },
    askScene() { return { ok: false, say: 'I have these backgrounds: ' + Object.keys(D.scenes).join(', ') + '. Which one?', check: 'needs a scene name' }; },
    // Navigation functions
    navigate({ view, label }) { go(view); return { ok: location.hash.slice(1) === view, say: label, check: `the address now points to "${view || 'home'}"` }; },
    // Assignment functions
    listAssignments() { go('assignments'); document.querySelectorAll('#asg-list details').forEach(d => d.classList.remove('pick')); return { ok: location.hash === '#assignments', say: 'Here are all your assignments:\n' + D.assignments.map(x => `${x.n}. ${x.title}`).join('\n'), check: `${D.assignments.length} assignments are listed on the page` }; },
    openAssignment({ a }) { const open = reveal(a); return { ok: open, say: `Opening Assignment ${a.n}: ${a.title}.`, check: `the Assignment ${a.n} card is expanded` }; },
    explainAssignment({ a }) { const open = reveal(a); return { ok: open, say: a.explain, check: `the Assignment ${a.n} card is expanded beside the explanation` }; },
    // Shopping functions
    searchProducts({ t }) { shown = findProducts(t); go('shop'); renderShop(); return { ok: grid.children.length === shown.length || !shown.length, say: shown.length ? `Found ${shown.length} product(s):\n` + shown.map((p, i) => `${i + 1}. ${p.name} (${money(p.price)})`).join('\n') + '\nSay "add the second product to my cart" to buy one.' : 'I found nothing like that. Try "keyboard", "headphones", or "backpack".', check: `${shown.length} result(s) are shown in the store` }; },
    addToCart({ p, note }) { const before = qty(p.id); const x = cart.find(c => c.id === p.id); if (x) x.qty++; else cart.push({ id: p.id, qty: 1 }); saveCart(); return { ok: qty(p.id) === before + 1, say: `Added ${p.name} to your cart.${note || ''}`, check: `${p.name} quantity is now ${qty(p.id)}` }; },
    removeFromCart({ i }) { const x = cart[i - 1]; if (!x) return { ok: false, say: 'Tell me which cart item to remove, like "remove the first item from my cart".', check: 'no matching cart item' }; const p = prod(x.id); cart.splice(i - 1, 1); saveCart(); return { ok: qty(p.id) === 0, say: `Removed ${p.name} from your cart.`, check: `${p.name} is no longer in the cart` }; },
    clearCart() { cart = []; saveCart(); return { ok: cart.length === 0, say: 'Your cart is empty.', check: 'the cart has 0 items' }; },
    showCart() { go('shop'); const n = cart.reduce((s, x) => s + x.qty, 0); return { ok: location.hash === '#shop', say: `Your cart has ${n} item(s). Opening the Shop page.`, check: 'the cart panel is visible' }; },
    checkout() { return { ok: true, say: 'This is a demo store, so there is no real checkout. Your cart total is shown on the Shop page.', check: 'demo store, no payment taken' }; },
    clarify({ say }) { return { ok: false, say, check: 'more detail needed' }; },
    // Media functions
    async playMedia({ kind }) {
      kind = kind || lastKind; if (!kind) return { ok: false, say: 'Play the music or the movie?', check: 'needs a choice' };
      if (!loaded(kind)) return { ok: false, say: `No ${kind} file has been added yet. Add its path to data.js and I can play it.`, check: `the ${kind} player has no file` };
      if (kind === 'movie') go('media'); lastKind = kind;
      try { await players[kind].play(); } catch (e) { return { ok: false, say: 'The browser blocked playback. Press play once on the Media page, then try again.', check: 'the browser blocked autoplay' }; }
      return { ok: !players[kind].paused, say: `Playing the ${kind}.`, check: `the ${kind} player is running` };
    },
    pauseMedia({ kind, stop }) {
      const ks = kind ? [kind] : ['music', 'movie']; let n = 0;
      ks.forEach(k => { const p = players[k]; if (loaded(k) && !p.paused) { p.pause(); n++; } if (stop && loaded(k)) p.currentTime = 0; });
      const ok = ks.every(k => players[k].paused);
      return { ok, say: n ? `${stop ? 'Stopped' : 'Paused'} the ${kind || 'playback'}.` : 'Nothing is playing right now.', check: ok ? 'all players are paused' : 'a player is still running' };
    },
    help() { return { ok: true, say: 'I run this site through a team of agents. Try:\n• "Change the background to blue"\n• "Switch to dark mode" or "light mode"\n• "Change the background image to a beach"\n• "Show me all my assignments"\n• "Open my data analysis project"\n• "Explain Assignment 5"\n• "Find a wireless keyboard"\n• "Add the second product to my cart"\n• "Play the music" / "Pause the video"\n• "Return to the homepage"\nI also answer school questions, like "how do I add fractions?"', check: 'help shown' }; }
  };

  /* =========================================================
     AGENTS. Each one only understands its own kind of request. It returns a
     plan (action + function + arguments) or null if the request is not its job.
     ========================================================= */
  const P = (action, fn, args, detail) => ({ action, fn, args, detail });
  const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };
  function ordinal(t, len) {
    if (/\blast\b/.test(t)) return len;
    const w = t.match(/\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\b/); if (w) return ORD[w[1]];
    const n = t.match(/(?:number|item|product|result|option|#)\s*(\d+)/); return n ? +n[1] : 0;
  }
  const NAV = /\b(go|return|back|take|open|show|switch|navigate|bring)\b/;
  const scenes = Object.keys(D.scenes);
  const asgByNumber = t => { const m = t.match(/(?:assignment|project)\s*(?:number\s*)?(\d+)|#(\d+)/); return m ? D.assignments.find(a => a.n === +(m[1] || m[2])) : null; };
  const asgByWords = t => { let best = null, s = 0; D.assignments.forEach(a => { const c = a.kw.filter(k => t.includes(k)).length; if (c > s) { s = c; best = a; } }); return /\b(project|assignment)\b/.test(t) ? best : null; };

  const AGENTS = [
    { id: 'help', name: 'Help', parse: t => /\b(help|what can you do|commands)\b/.test(t) ? P('show help', 'help', {}) : null },
    { id: 'media', name: 'Media', parse(t) {
      const verb = t.match(/\b(play|pause|resume|stop)\b/); if (!verb) return null;
      const kind = /\b(music|song|songs|audio|track)\b/.test(t) ? 'music' : /\b(movie|video|film|echo)\b/.test(t) ? 'movie' : null;
      if (!kind && !/^(play|pause|stop|resume)( it| playing| playback| everything)?$/.test(t)) return null;
      if (verb[1] === 'pause' || verb[1] === 'stop') return P(`${verb[1]} playback`, 'pauseMedia', { kind, stop: verb[1] === 'stop' }, `target = ${kind || 'everything'}`);
      return P(`play ${kind || 'last played media'}`, 'playMedia', { kind }, `target = ${kind || 'last played'}`);
    } },
    { id: 'shop', name: 'Shopping', parse(t) {
      if (/\b(cart|basket)\b/.test(t)) {
        if (/\b(clear|empty)\b/.test(t)) return P('empty the cart', 'clearCart', {});
        if (/\b(checkout|check out|pay)\b/.test(t)) return P('check out', 'checkout', {});
        if (/\b(remove|delete|take)\b/.test(t)) return P('remove a cart item', 'removeFromCart', { i: ordinal(t, cart.length) }, `cart position = ${ordinal(t, cart.length) || 'unknown'}`);
        if (/\b(add|put)\b/.test(t)) {
          const i = ordinal(t, shown.length);
          if (i) { const p = shown[i - 1]; return p ? P('add a product to the cart', 'addToCart', { p }, `result #${i} = ${p.name}`) : P('add a product to the cart', 'clarify', { say: `There is no product number ${i} in the current results (${shown.length} shown).` }); }
          const m = findProducts(t);
          if (m.length && m.length < D.products.length) return P('add a product to the cart', 'addToCart', { p: m[0], note: m.length > 1 ? ' (I picked the first match. Say "second" to choose another.)' : '' }, `product = ${m[0].name}`);
          return P('add a product to the cart', 'clarify', { say: 'Which product? Search first, then say "add the second product to my cart".' });
        }
        return P('show the cart', 'showCart', {});
      }
      const words = tokens(t), matches = D.products.some(p => words.some(w => (p.name + ' ' + p.tags).toLowerCase().includes(w)));
      const verb = /\b(find|search|look|looking|buy|shop|need|want|get|show|browse)\b/.test(t);
      if (!(verb && matches) && !/\b(shop|store|products)\b/.test(t)) return null;
      if (/\b(go|open|take)\b/.test(t) && !matches) return P('open the shop', 'navigate', { view: 'shop', label: 'Opening the Shop.' }, 'page = shop');
      return P('search the store', 'searchProducts', { t }, `search = "${words.join(' ') || 'everything'}"`);
    } },
    { id: 'theme', name: 'Theme', parse(t) {
      if (/\b(reset|default|original)\b/.test(t) && /\b(theme|look|background|colors?|colours?|site|everything)\b/.test(t)) return P('reset the appearance', 'resetLook', {});
      const sc = scenes.find(s => t.includes(s) || (s === 'mountains' && t.includes('mountain')));
      if (sc && /\b(background|image|picture|photo|wallpaper|scene|backdrop|theme|change|make)\b/.test(t)) return P('change the background image', 'setScene', { name: sc }, `scene = ${sc}`);
      if (/\b(image|picture|photo|wallpaper|scene)\b/.test(t) && /\b(background|change|set|switch)\b/.test(t)) return P('change the background image', 'askScene', {});
      if (/(dark|night) (mode|theme)|blackboard( mode)?\b|\bgo dark\b/.test(t)) return P('switch the mode', 'setMode', { mode: 'dark' }, 'mode = dark');
      if (/(light|day) (mode|theme)|whiteboard|\bgo light\b/.test(t)) return P('switch the mode', 'setMode', { mode: 'light' }, 'mode = light');
      if (/\b(background|backdrop|colou?r|website|site|page|board)\b/.test(t) && /\b(change|make|set|turn|switch|paint)\b/.test(t)) {
        for (const w of (t.match(/#[0-9a-f]{3,6}\b|[a-z]+/g) || []).reverse()) {
          if (['dark', 'light', 'color', 'colour', 'background', 'page', 'site', 'website', 'board'].includes(w)) continue;
          const hex = (/\b(dark|light)\b/.test(t) && toColor((/dark/.test(t) ? 'dark' : 'light') + w)) || toColor(w);
          if (hex) return P('change the background color', 'setColor', { hex, name: w }, `color = ${w} (${hex})`);
        }
        return P('change the background', 'clarify', { say: 'I did not recognize that as a color or scene. Try a color like blue or purple, or a scene: ' + scenes.join(', ') + '.' });
      }
      return null;
    } },
    { id: 'assign', name: 'Assignments', parse(t) {
      const a = asgByNumber(t) || asgByWords(t);
      if (/\b(explain|describe|summarize|tell me about)\b/.test(t) && a) return P('explain an assignment', 'explainAssignment', { a }, `assignment = ${a.n}`);
      if (a && NAV.test(t)) return P('open an assignment', 'openAssignment', { a }, `assignment = ${a.n}`);
      if (/\b(assignments|projects)\b/.test(t) && (/\b(all|every|list|my)\b/.test(t) || NAV.test(t))) return P('list all assignments', 'listAssignments', {});
      return null;
    } },
    { id: 'nav', name: 'Navigation', parse(t) {
      if (!NAV.test(t) && t !== 'home') return null;
      const to = (view, label, name) => P('go to a page', 'navigate', { view, label }, `page = ${name}`);
      if (/\b(home|homepage|main page|start page)\b/.test(t) || t === 'home') return to('', 'Back on the homepage.', 'home');
      if (/\b(idea|about chalkroom|about the site)\b/.test(t)) return to('idea', 'Opening the idea page.', 'idea');
      if (/\b(team|assistants|tutors)\b/.test(t)) return to('team', 'Opening the team of assistants.', 'team');
      if (/\b(media|player)\b/.test(t)) return to('media', 'Opening the media page.', 'media');
      return null;
    } }
  ];

  /* =========================================================
     ORCHESTRATOR: the five-step workflow every command goes through.
     ========================================================= */
  const lights = {};
  function light(id) { const li = lights[id]; if (!li) return; li.classList.add('hit'); setTimeout(() => li.classList.remove('hit'), 1600); }
  async function run(text) {
    const q = C.clean(text), t = q.toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return null;
    for (const ag of AGENTS) {                                   // 1. Recognize: find the agent whose job this is
      const plan = ag.parse(t); if (!plan) continue;             // 2. Identify the requested action
      light(ag.id);
      const res = await Tools[plan.fn](plan.args || {});         // 3. Select the website function, 4. Execute it
      return { text: res.say, agent: ag.name, trace: [           // 5. Confirm the result on the page
        `Recognize: the ${ag.name} agent understood "${q}".`,
        `Identify action: ${plan.action}${plan.detail ? ' (' + plan.detail + ')' : ''}.`,
        `Select function: ${plan.fn}().`,
        'Execute: the function ran on the page.',
        `Confirm: ${res.check}. ${res.ok ? 'Verified.' : 'Not completed.'}`] };
    }
    return null;
  }
  window.Control = { run };

  /* ---------- One chat interface: commands first, then subject assistants ---------- */
  const fab = el('button', 'btn', 'Control'); fab.id = 'ctl-fab'; fab.type = 'button'; fab.setAttribute('aria-expanded', 'false');
  const panel = el('aside'); panel.id = 'ctl'; panel.hidden = true; panel.setAttribute('aria-label', 'Site control chat');
  const strip = el('ul', 'agents'); strip.setAttribute('aria-label', 'Agents');
  [['nav', 'Navigation'], ['theme', 'Theme'], ['assign', 'Assignments'], ['shop', 'Shopping'], ['media', 'Media'], ['tutor', 'Tutors']].forEach(([id, n]) => { const li = el('li', '', n); strip.append(li); lights[id] = li; });
  const log = el('div', 'log'); log.setAttribute('aria-live', 'polite');
  const form = el('form'), inp = el('input'), send = el('button', 'btn', 'Send'); inp.maxLength = 200; inp.setAttribute('aria-label', 'Type a command'); inp.placeholder = 'Type or say a command';
  form.append(inp, send); panel.append(el('h3', '', 'Control the site'), strip, log, form); body.append(fab, panel);
  function add(t, me, trace) {
    const m = el('div', 'm' + (me ? ' me' : ''), t);
    if (trace) { const d = el('details'), ol = el('ol'); d.append(el('summary', '', 'Agent steps')); trace.forEach(s => ol.append(el('li', '', s))); d.append(ol); m.append(d); }
    log.append(m); log.scrollTop = log.scrollHeight;
  }
  async function handle(q) {
    q = C.clean(q); if (!q) return; add(q, true);
    const r = await run(q); if (r) { add(r.text, false, r.trace); return; }
    const [a] = C.best(q);
    if (a) { light('tutor'); add(`${a.name} (${a.subject}): ${C.reply(a, q).text}`, false, [`Recognize: this is a school question, not a site command.`, `Identify action: answer a ${a.subject.toLowerCase()} question.`, `Select function: the ${a.name} subject assistant.`, 'Execute: looked up the answer in its subject knowledge.', 'Confirm: answer returned. Verified.']); }
    else add('I did not catch a command or a school question. Say "help" to see what I can do.');
  }
  add('Hi, I run this site with a team of agents. Tell me what to do, like "change the background to a beach" or "find a wireless keyboard." Say "help" for more.');
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

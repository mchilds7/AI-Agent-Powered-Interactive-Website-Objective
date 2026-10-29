(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  // Every user input passes through this before it is used. Output is always set with textContent.
  const clean = (s, max = 200) => String(s).replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);

  /* ---------- The team: each assistant has its own subject, teaching style, and knowledge ---------- */
  const AGENTS = [
    { id: 'calc', name: 'Calc', subject: 'Math', style: 'Shows every step so you can repeat it on a test.',
      kw: ['math', 'equation', 'solve', 'fraction', 'percent', 'slope', 'quadratic', 'algebra', 'geometry', 'area', 'calculate', 'graph', 'derivative', 'triangle'],
      tries: ['What is (12 + 8) * 3?', 'How do I add fractions?', 'Explain the quadratic formula'],
      kb: [[['fraction'], 'To add fractions, find a common denominator, add the numerators, then simplify.\nExample: 1/3 + 1/4 becomes 4/12 + 3/12 = 7/12.'],
        [['quadratic'], 'For ax² + bx + c = 0, x = (−b ± √(b² − 4ac)) / 2a.\nThe part under the root, b² − 4ac, tells you how many real solutions exist. Which numbers do you have for a, b, and c?'],
        [['slope', 'line'], 'Slope = rise over run = (y₂ − y₁) / (x₂ − x₁).\nStart by writing down your two points. What are they?'],
        [['percent'], 'Percent means "per hundred." To find 15% of 80, change 15% to 0.15 and multiply: 0.15 × 80 = 12.'],
        [['area', 'triangle', 'geometry'], 'Triangle area = ½ × base × height. Rectangle area = length × width. Circle area = π × radius².']] },
    { id: 'lab', name: 'Lab', subject: 'Science', style: 'Explains the why, then asks you to predict what happens.',
      kw: ['science', 'photosynthesis', 'cell', 'atom', 'newton', 'force', 'energy', 'chemistry', 'biology', 'physics', 'molecule', 'gravity', 'dna'],
      tries: ['How does photosynthesis work?', 'Explain Newton\'s laws', 'What is an atom?'],
      kb: [[['photosynthesis'], 'Plants turn light, water, and carbon dioxide into glucose and oxygen: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. It happens in the chloroplasts. What do you think would happen to a plant kept in the dark?'],
        [['newton', 'force', 'gravity'], 'Newton\'s three laws: 1) objects keep their motion unless a force acts on them; 2) force = mass × acceleration; 3) every action has an equal and opposite reaction.'],
        [['atom', 'molecule'], 'An atom has protons (positive) and neutrons in its nucleus, with electrons around it. The number of protons is the atomic number and decides which element it is.'],
        [['cell', 'dna', 'biology'], 'Cells are the basic units of life. DNA in the nucleus holds the instructions for building proteins, and mitochondria release energy for the cell.']] },
    { id: 'quill', name: 'Quill', subject: 'Writing', style: 'Improves your draft. It never writes it for you.',
      kw: ['essay', 'thesis', 'paragraph', 'grammar', 'comma', 'write', 'writing', 'draft', 'outline', 'sentence', 'english', 'introduction', 'conclusion'],
      tries: ['How do I write a thesis?', 'Help me with a body paragraph', 'What is a comma splice?'],
      kb: [[['thesis'], 'A thesis is one sentence that makes an arguable claim and previews your reasons. Weak: "Social media is everywhere." Stronger: "Social media harms teens\' sleep, so schools should limit phone use at night." What is your topic?'],
        [['paragraph'], 'Build each body paragraph as claim, evidence, explanation. State your point, quote or cite proof, then explain how the proof supports the point.'],
        [['comma', 'splice', 'grammar'], 'A comma splice joins two full sentences with only a comma. Fix it with a period, a semicolon, or a comma plus "and," "but," or "so."'],
        [['outline', 'introduction', 'conclusion'], 'A simple outline: introduction with your thesis, three body paragraphs (one reason each), and a conclusion that restates the thesis in new words.']] },
    { id: 'atlas', name: 'Atlas', subject: 'History and civics', style: 'Connects events through cause and effect.',
      kw: ['history', 'war', 'revolution', 'constitution', 'government', 'branches', 'civil', 'president', 'empire', 'wwi', 'civics', 'congress'],
      tries: ['What caused World War I?', 'What are the three branches of government?', 'Summarize the Industrial Revolution'],
      kb: [[['wwi', 'world', 'war'], 'Historians often use MAIN to remember the causes of World War I: Militarism, Alliances, Imperialism, and Nationalism. The assassination of Archduke Franz Ferdinand in 1914 set the chain in motion.'],
        [['branches', 'government', 'constitution', 'congress', 'president'], 'The Constitution splits power into three branches: legislative (Congress makes laws), executive (the President enforces them), and judicial (courts interpret them). Checks and balances keep any one from taking over.'],
        [['industrial', 'revolution'], 'The Industrial Revolution began in Britain in the late 1700s. Machines and factories replaced much hand production, and cities grew fast as people moved for work.']] },
    { id: 'byte', name: 'Byte', subject: 'Technology', style: 'Uses everyday comparisons for technical ideas.',
      kw: ['code', 'coding', 'python', 'computer', 'internet', 'password', 'variable', 'loop', 'software', 'hardware', 'wifi', 'security', 'program'],
      tries: ['What is a variable?', 'How does the internet work?', 'What makes a strong password?'],
      kb: [[['variable', 'loop', 'code', 'coding', 'python', 'program'], 'A variable is a labeled box that stores a value, like score = 10. A loop repeats steps until a condition is met, like "add 1 to score until it reaches 20."'],
        [['internet', 'wifi'], 'The internet moves data in small packets. Your device asks a DNS server to turn a name into an address, and routers pass packets along until they arrive and are reassembled.'],
        [['password', 'security'], 'Strong passwords are long (12+ characters), unique for every account, and stored in a password manager. Turn on two-factor authentication where you can.']] },
    { id: 'lingo', name: 'Lingo', subject: 'Languages', style: 'Teaches patterns first, then practice phrases.',
      kw: ['spanish', 'french', 'language', 'translate', 'vocabulary', 'conjugate', 'ser', 'estar', 'verb'],
      tries: ['Ser vs estar in Spanish', 'How do I learn vocabulary?'],
      kb: [[['ser', 'estar'], 'In Spanish, ser describes what something is (identity, origin, traits): "Soy estudiante." Estar describes how or where it is (feelings, location, conditions): "Estoy cansado."'],
        [['vocabulary', 'learn', 'verb', 'conjugate'], 'Learn new words in short daily sessions, say them aloud, and use each in your own sentence. Review words again after 1 day, 3 days, and a week.']] },
    { id: 'coach', name: 'Coach', subject: 'Study skills', style: 'Helps you plan, start, and stay on track.',
      kw: ['study', 'plan', 'test', 'exam', 'homework', 'procrastinate', 'focus', 'schedule', 'notes', 'memorize', 'time'],
      tries: ['How do I study for a test?', 'I keep procrastinating', 'Make me a study plan'],
      kb: [[['plan', 'schedule', 'time', 'homework'], 'Try this plan: list tasks by due date, pick the hardest one first, work in 25-minute blocks with 5-minute breaks, and stop each session by writing what to do next.'],
        [['test', 'exam', 'study', 'memorize', 'notes'], 'Practice recalling instead of rereading: close your notes and write what you remember, then check. Spread sessions across several days.'],
        [['procrastinate', 'focus'], 'Make the first step tiny. Promise yourself five minutes, phone in another room. Starting is the hard part, and most people keep going.']] }
  ];
  const byId = id => AGENTS.find(a => a.id === id);
  const words = q => clean(q).toLowerCase().split(/[^a-z0-9²]+/).filter(Boolean);
  const hits = (list, w) => list.filter(k => w.some(x => x === k || (k.length > 4 && x.startsWith(k)))).length;
  const mathText = q => clean(q).replace(/[=?]/g, '').replace(/^(what is|what's|calculate|compute|solve|find)\s*/i, '').replace(/×/g, '*').replace(/÷/g, '/').trim();
  const isMath = q => { const m = mathText(q); return /^[\d\s+\-*/^().]+$/.test(m) && /\d/.test(m) && /[+\-*/^]/.test(m); };
  const score = (a, q) => { const w = words(q); return hits(a.kw, w) + (a.id === 'calc' && isMath(q) ? 3 : 0); };
  const best = (q, skip) => { let top = null, s = 0; AGENTS.forEach(a => { if (a.id === skip) return; const x = score(a, q); if (x > s) { s = x; top = a; } }); return [top, s]; };

  // Safe calculator: a small parser, no eval.
  function calc(src) {
    const t = src.match(/\d+\.?\d*|[+\-*/^()]/g) || []; let i = 0;
    const peek = () => t[i], next = () => t[i++];
    function prim() { const x = next(); if (x === '(') { const v = add(); if (next() !== ')') throw 0; return v; } if (x === '-') return -prim(); if (/^\d/.test(x || '')) return parseFloat(x); throw 0; }
    function pow() { const b = prim(); if (peek() === '^') { next(); return Math.pow(b, pow()); } return b; }
    function mul() { let v = pow(); while (peek() === '*' || peek() === '/') v = next() === '*' ? v * pow() : v / pow(); return v; }
    function add() { let v = mul(); while (peek() === '+' || peek() === '-') v = next() === '+' ? v + mul() : v - mul(); return v; }
    const r = add(); if (i < t.length || !isFinite(r)) throw 0; return Math.round(r * 1e9) / 1e9;
  }

  /* ---------- Reply logic: answer in lane, or hand off ---------- */
  function reply(agent, q) {
    if (agent.id === 'calc' && isMath(q)) { try { return { text: `${mathText(q)} = ${calc(mathText(q))}\nOrder of operations: parentheses, exponents, multiply and divide, then add and subtract.` }; } catch { return { text: 'I couldn\'t read that expression. Check the parentheses and operators.' }; } }
    if (agent.id === 'quill' && /write (my|the|an|a|me)\b.*\b(essay|paper)/i.test(q)) return { text: 'I won\'t write it for you, because the writing is how you learn. I can help you build an outline, sharpen a thesis, or give feedback on a paragraph. Which one?' };
    const own = score(agent, q), [other, os] = best(q, agent.id);
    if (other && os > own) return { text: `That sounds like a question for ${other.name}, our ${other.subject.toLowerCase()} assistant.`, handoff: other };
    const w = words(q); let e = null, s = 0;
    agent.kb.forEach(x => { const c = hits(x[0], w); if (c > s) { s = c; e = x; } });
    return e ? { text: e[1] } : { text: `I'm not sure about that one yet. I can help with ${agent.subject.toLowerCase()} questions like the ones below.` };
  }

  /* ---------- Team view ---------- */
  const picker = $('#picker'), room = $('#room'), rooms = {};
  let current = null;
  AGENTS.forEach(a => {
    const b = el('button', '', a.name); b.type = 'button'; b.setAttribute('role', 'tab'); b.append(el('small', '', a.subject));
    b.addEventListener('click', () => select(a.id)); a.btn = b; picker.append(b);
  });
  function build(a) {
    const box = el('div'); const who = el('div', 'who'); who.append(el('h3', '', `${a.name}: ${a.subject}`), el('p', '', a.style));
    const log = el('div', 'log'); log.setAttribute('aria-live', 'polite'); log.tabIndex = 0;
    const tries = el('div', 'tries'); const f = el('form'), i = el('input'), s = el('button', 'btn', 'Ask');
    i.maxLength = 200; i.setAttribute('aria-label', `Ask ${a.name}`); i.placeholder = `Ask ${a.name} about ${a.subject.toLowerCase()}`; f.append(i, s);
    const add = (t, me) => { const m = el('div', 'm' + (me ? ' me' : ''), t); log.append(m); log.scrollTop = log.scrollHeight; return m; };
    const ask = q => {
      q = clean(q); if (!q) return; add(q, true); const r = reply(a, q), m = add(r.text);
      if (r.handoff) { const b = el('button', 'btn alt', `Ask ${r.handoff.name}`); b.type = 'button'; b.addEventListener('click', () => { select(r.handoff.id); rooms[r.handoff.id].ask(q); }); m.append(b); }
    };
    a.tries.forEach(t => { const b = el('button', '', t); b.type = 'button'; b.addEventListener('click', () => ask(t)); tries.append(b); });
    f.addEventListener('submit', e => { e.preventDefault(); const v = i.value; i.value = ''; ask(v); });
    add(`Hi, I'm ${a.name}. ${a.style}`); box.append(who, log, tries, f);
    return { box, ask, input: i };
  }
  function select(id) {
    const a = byId(id); current = a;
    AGENTS.forEach(x => x.btn.setAttribute('aria-selected', String(x === a)));
    if (!rooms[id]) rooms[id] = build(a);
    room.textContent = ''; room.append(rooms[id].box);
  }

  /* ---------- Home: the router ---------- */
  const roster = $('#roster'), msg = $('#route-msg'), chips = {};
  AGENTS.forEach(a => { const li = el('li', '', `${a.name} · ${a.subject}`); roster.append(li); chips[a.id] = li; });
  $('#router').addEventListener('submit', e => {
    e.preventDefault(); const q = clean($('#rq').value); if (!q) { msg.textContent = 'Type a question first.'; return; }
    const [a] = best(q), pick = a || byId('coach');
    Object.values(chips).forEach(c => c.classList.remove('hit')); chips[pick.id].classList.add('hit');
    msg.textContent = a ? `Sending your question to ${pick.name}, our ${pick.subject.toLowerCase()} assistant.` : `No clear subject found, so ${pick.name} will help you decide where to start.`;
    setTimeout(() => { location.hash = 'team'; select(pick.id); rooms[pick.id].ask(q); $('#rq').value = ''; }, 1100);
  });

  /* ---------- Page routing ---------- */
  const views = [...document.querySelectorAll('.view')], links = [...document.querySelectorAll('nav a')];
  function route() {
    const v = views.find(x => x.id === location.hash.slice(1)) || views[0];
    views.forEach(x => x.classList.toggle('on', x === v));
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + v.id));
    if (v.id === 'team' && !current) select('calc');
    window.scrollTo(0, 0);
  }
  addEventListener('hashchange', route); route();
})();

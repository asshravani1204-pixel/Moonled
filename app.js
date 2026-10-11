document.documentElement.classList.add('js');
const KEY = 'moonledger.v1';
const CATS = ['Food', 'Travel', 'Study', 'Shopping', 'Bills', 'Fun', 'Health', 'Gifts', 'Other'];
const VS = ['today', 'week', 'month'];
const NAMES = ['Today', 'This week', 'This moon'];
const LINES = ['Another ember given to the night.', 'The moon will remember {a}.', 'Spent softly, and noted in the dark.', '{a}, slipped beneath the stars.'];
const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const short = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const fmt = n => (n < 0 ? '-' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const sum = a => a.reduce((t, i) => t + i.amt, 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const blank = () => ({ income: 0, goal: 0, items: [] });

let db = load(), cat = CATS[0], lastId = null;

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    return d && Array.isArray(d.items) ? Object.assign(blank(), d) : blank();
  } catch (e) { return blank(); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { flash('The night would not keep this. Storage is blocked.'); }
}

let flashT;
function flash(t) {
  $('#msg').textContent = t;
  clearTimeout(flashT);
  flashT = setTimeout(() => $('#msg').textContent = '', 3200);
}

/* numbers that count up like a slow breath */
function num(el, to) {
  const from = +el.dataset.v || 0;
  el.dataset.v = to;
  if (RM || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  (function f(t) {
    const p = Math.min((t - t0) / 800, 1), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(f);
  })(t0);
}

function weekStart(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function range(v) {
  const n = new Date();
  if (v === 'today') return [ymd(n), ymd(n), n.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }), 1];
  if (v === 'week') {
    const s = weekStart(n), e = new Date(s);
    e.setDate(s.getDate() + 6);
    return [ymd(s), ymd(e), short(s) + ' to ' + short(e), Math.round((parse(ymd(n)) - s) / 864e5) + 1];
  }
  return [ymd(new Date(n.getFullYear(), n.getMonth(), 1)), ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)),
    n.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), n.getDate()];
}

/* build the three ledger panels once */
$('#car').innerHTML = NAMES.map((n, k) =>
  `<article class="pan card" id="p${k}" aria-label="${n}"><p class="lb muted"></p><p class="tt big"></p><p class="mm muted"></p><div class="cats"></div><ul></ul></article>`
).join('');

function render() {
  VS.forEach((v, k) => {
    const [a, b, label, days] = range(v), p = $('#p' + k);
    const rows = db.items.slice().reverse().filter(i => i.date >= a && i.date <= b).sort((x, y) => y.date.localeCompare(x.date));
    const tot = sum(rows), by = {};
    rows.forEach(i => by[i.cat] = (by[i.cat] || 0) + i.amt);
    p.querySelector('.lb').textContent = label;
    num(p.querySelector('.tt'), tot);
    p.querySelector('.mm').textContent = rows.length
      ? `${rows.length} ${rows.length === 1 ? 'offering' : 'offerings'}` + (v !== 'today' ? `, about ${fmt(tot / days)} a day` : '')
      : '';
    p.querySelector('.cats').innerHTML = Object.entries(by).sort((x, y) => y[1] - x[1]).map(([c, n]) =>
      `<div class="cat"><span>${esc(c)}</span><span>${fmt(n)}</span><i style="width:${tot ? n / tot * 100 : 0}%"></i></div>`).join('');
    p.querySelector('ul').innerHTML = rows.length
      ? rows.map(i =>
          `<li${i.id === lastId ? ' class="new"' : ''}><span>${esc(i.cat)}</span><span class="muted">${short(parse(i.date))}</span><span>${fmt(i.amt)}</span>` +
          `<button class="x" data-id="${esc(i.id)}" aria-label="Remove ${esc(i.cat)} ${fmt(i.amt)}">×</button></li>`).join('')
      : '<li class="empty">Nothing yet. The night is quiet.</li>';
  });
  lastId = null;

  const [ms, me] = range('month');
  const spentM = sum(db.items.filter(i => i.date >= ms && i.date <= me));
  const inc = db.income, f = inc > 0 ? Math.min(spentM / inc, 1) : 0;
  $('#shade').style.cx = (100 + 168 * (1 - f)) + 'px';

  if (inc > 0) {
    const left = inc - spentM;
    num($('#mn'), Math.abs(left));
    $('#mt').textContent = left >= 0 ? ' still glows' : ' lost to the dark';
    $('#moon-sub').textContent = `of ${fmt(inc)} this moon, ${fmt(spentM)} given to the night`;
  } else {
    num($('#mn'), spentM);
    $('#mt').textContent = ' given to the night';
    $('#moon-sub').textContent = 'Tell me what you earn in Settings, and the moon will begin to wane.';
  }

  if (inc > 0) {
    const saved = inc - spentM;
    num($('#sv'), saved);
    $('#sv-sub').textContent = `kept so far this moon: ${fmt(inc)} earned, ${fmt(spentM)} given away`;
    if (db.goal > 0) {
      const pc = Math.max(0, Math.min(saved / db.goal, 1)), room = Math.max(inc - db.goal, 0) - spentM;
      $('#bar').hidden = false;
      $('#bar-i').style.width = pc * 100 + '%';
      $('#sv-pct').textContent = `${Math.round(pc * 100)}% of the way to your ${fmt(db.goal)} dawn`;
      $('#sv-note').textContent = room >= 0
        ? `You may spend ${fmt(room)} more and still keep your promise.`
        : `You have wandered ${fmt(-room)} past your promise.`;
    } else {
      $('#bar').hidden = true;
      $('#sv-pct').textContent = '';
      $('#sv-note').textContent = 'Name a monthly savings goal in Settings, and the dawn will have a shape.';
    }
  } else {
    $('#sv').textContent = '—';
    $('#sv').dataset.v = 0;
    $('#sv-sub').textContent = 'Tell me what you earn, and I will keep count of what remains.';
    $('#bar').hidden = true;
    $('#sv-pct').textContent = '';
    $('#sv-note').textContent = '';
  }
}

/* the offering */
const chips = $('#chips');
CATS.forEach(c => {
  const b = document.createElement('button');
  b.className = 'chip';
  b.textContent = c;
  b.setAttribute('aria-pressed', c === cat);
  b.onclick = () => {
    cat = c;
    [...chips.children].forEach(x => x.setAttribute('aria-pressed', x.textContent === c));
  };
  chips.appendChild(b);
});
$('#date').value = ymd(new Date());

function embers(btn) {
  if (RM) return;
  const r = btn.getBoundingClientRect();
  for (let i = 0; i < 9; i++) {
    const e = document.createElement('i'), a = Math.PI * (1.1 + .8 * Math.random()), d = 40 + Math.random() * 55;
    e.className = 'ember';
    e.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px`;
    document.body.appendChild(e);
    setTimeout(() => e.remove(), 1000);
  }
}

function add() {
  const amt = parseFloat($('#amount').value.replace(/,/g, ''));
  if (!(amt > 0)) { flash('Name an amount, even a small one.'); $('#amount').focus(); return; }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db.items.push({ id, amt: Math.round(amt * 100) / 100, cat, date: $('#date').value || ymd(new Date()) });
  lastId = id;
  save();
  embers($('#add'));
  $('#amount').value = '';
  flash(LINES[Math.random() * LINES.length | 0].replace('{a}', fmt(amt)));
  render();
}
$('#add').onclick = add;
$('#amount').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });

/* ledger: swipe sideways, tabs follow */
const car = $('#car'), tabs = [...document.querySelectorAll('.tabs button')];
const pitch = () => $('#p1').offsetLeft - $('#p0').offsetLeft;
tabs.forEach((t, i) => t.onclick = () => car.scrollTo({ left: i * pitch(), behavior: RM ? 'auto' : 'smooth' }));
car.addEventListener('scroll', () => {
  const i = Math.round(car.scrollLeft / pitch());
  tabs.forEach((t, j) => t.setAttribute('aria-selected', j === i));
}, { passive: true });
car.addEventListener('click', e => {
  const id = e.target.dataset && e.target.dataset.id;
  if (id && confirm('Let this entry fade away?')) {
    db.items = db.items.filter(i => i.id !== id);
    save();
    render();
  }
});

/* settings */
const dlg = $('#settings');
document.querySelectorAll('.open-settings').forEach(b => b.onclick = () => {
  $('#income').value = db.income || '';
  $('#goal').value = db.goal || '';
  dlg.showModal();
});
$('#close-settings').onclick = () => dlg.close();
$('#save-settings').onclick = () => {
  db.income = Math.max(0, parseFloat($('#income').value) || 0);
  db.goal = Math.max(0, parseFloat($('#goal').value) || 0);
  save();
  dlg.close();
  render();
};
$('#export').onclick = () => {
  const u = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = u;
  a.download = 'moonledger-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$('#import-btn').onclick = () => $('#import').click();
$('#import').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.items)) throw 0;
      db = Object.assign(blank(), d);
      save();
      dlg.close();
      render();
    } catch (x) { alert('This is not a Moonledger backup.'); }
  };
  r.readAsText(f);
  e.target.value = '';
};
$('#erase').onclick = () => {
  if (confirm('Let everything fade? This cannot be undone.')) {
    db = blank();
    save();
    dlg.close();
    render();
  }
};

/* stars, reveals, chapter dots */
const st = $('#stars');
for (let i = 0; i < 46; i++) {
  const s = document.createElement('i');
  s.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--d:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s;opacity:${.3 + Math.random() * .5}`;
  st.appendChild(s);
}
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('in')), { threshold: .15 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

const dots = [...document.querySelectorAll('#dots button')];
const so = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) dots.forEach(d => d.setAttribute('aria-current', d.dataset.t === e.target.id));
}), { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('.ch').forEach(c => so.observe(c));
dots.forEach(d => d.onclick = () => document.getElementById(d.dataset.t).scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }));

/* install + offline */
let dp;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); dp = e; $('#install').hidden = false; });
$('#install').onclick = async () => {
  if (!dp) return;
  dp.prompt();
  await dp.userChoice;
  dp = null;
  $('#install').hidden = true;
};
addEventListener('appinstalled', () => $('#install').hidden = true);
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { $('#date').value = ymd(new Date()); render(); }
});

render();
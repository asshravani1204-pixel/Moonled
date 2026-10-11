(() => {
  const orb = document.querySelector('.orb');
  if (!orb) return;

  /* sparkles around the moon */
  const N = 18, list = [];
  const box = document.createElement('div');
  box.className = 'sparks';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < N; i++) {
    const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 27;
    s.className = 'sp';
    s.style.cssText = `left:${50 + Math.cos(a) * d}%;top:${50 + Math.sin(a) * d}%;--s:${4 + Math.random() * 8}px;--d:${1.8 + Math.random() * 2.6}s;--dl:${-Math.random() * 4}s`;
    box.appendChild(s);
    list.push(s);
  }
  orb.appendChild(box);

  /* brightness, glow and sparkle count follow how much income is left */
  function lumen() {
    const [ms, me] = range('month');
    const spent = sum(db.items.filter(i => i.date >= ms && i.date <= me));
    const r = db.income > 0 ? Math.max(0, Math.min(1, 1 - spent / db.income)) : 1;
    orb.style.setProperty('--r', r.toFixed(3));
    const on = r < 0.02 ? 0 : Math.ceil(r * N);
    list.forEach((s, i) => s.classList.toggle('off', i >= on));
  }
  const base = render;
  render = function () { base(); lumen(); };
  lumen();

  /* sparks on every tap */
  const COLS = ['#8F90E0', '#C9A6B2', '#F1E4F0', '#997480', '#5A5B9F'];
  document.addEventListener('pointerdown', e => {
    if (RM || !e.target.closest('button, .chip, input[type=date]')) return;
    const host = e.target.closest('dialog') || document.body;
    for (let i = 0; i < 8; i++) {
      const t = document.createElement('i'), a = Math.random() * 6.283, d = 26 + Math.random() * 34;
      t.className = 'tap';
      t.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--s:${5 + Math.random() * 7}px;--c:${COLS[i % COLS.length]}`;
      host.appendChild(t);
      setTimeout(() => t.remove(), 750);
    }
  });
})();
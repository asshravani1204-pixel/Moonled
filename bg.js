const bg = document.getElementById('bg');
const pos = ['0%', '40%', '100%', '72%'];
const secs = [...document.querySelectorAll('.ch')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) bg.style.backgroundPosition = pos[secs.indexOf(e.target)] + ' 50%';
}), { rootMargin: '-45% 0px -45% 0px' });
secs.forEach(s => io.observe(s));
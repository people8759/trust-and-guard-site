const intro = document.getElementById('intro');
const canvas = document.getElementById('dots');
const ctx = canvas.getContext('2d');

// 圓點的數量
const DOT_COUNT = 40;
// 圓點漂浮多久后開始睜開眼睛動畫
const DRIFT_MS = 2500;

function resize(){
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

const dots = Array.from({length: DOT_COUNT}, () => ({
    angle: Math.random() * 2 * Math.PI,
    dist: Math.random() * 40,
    speed: 0.15 + Math.random() * 0.5,
    size: 1 + Math.random() * 3,
    alpha: 0.2 + Math.random() * 0.8,
}));

let start = null;

function draw(t){
    if(start === null) start = t;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

for (const dot of dots){
    dot.dist += dot.speed;
    const x = cx + Math.cos(dot.angle) * dot.dist;
    const y = cy + Math.sin(dot.angle) * dot.dist;

    const fade = Math.max(0, 1 - dot.dist / (Math.max(w,h) * 0.6));
    ctx.beginPath();
    ctx.arc(x, y, dot.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha * fade})`;
    ctx.shadowColor = `rgba(255, 255, 255, 0.8)`;
    ctx.shadowBlur = 8;
    ctx.fill();
}

if (t - start >= DRIFT_MS && !intro.classList.contains("open")){
    intro.classList.add('open');
    setTimeout(() => intro.remove(), 1800);
    return;
}
requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
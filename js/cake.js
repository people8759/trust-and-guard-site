const FLAVORS = ['cream', 'strawberry', 'chocolate', 'matcha'];
const LAYER_H = 30;
const PLATE_H = 14;
const PLATE_BOTTOM = 96;
const BASE_W = 168;
const EDGE = 8;
const PERFECT_PX = 4;
const MIN_OVERLAP = 3;
const DROP_MS = 110;
const GAP_ABOVE = 120;
const TOPPER_SINK = 3;
const BEST_KEY = 'cakeBest';

const pageEl = document.getElementById('page');
const pauseBtn = document.getElementById('pauseBtn');
const stagePlay = document.getElementById('stagePlay');
const world = document.getElementById('world');
const pauseLayer = document.getElementById('pauseLayer');
const perfectEl = document.getElementById('perfect');
const comboEl = document.getElementById('combo');
const comboN = document.getElementById('comboN');
const scoreN = document.getElementById('scoreN');
const bestHud = document.getElementById('bestHud');
const bestRow = document.getElementById('bestRow');
const bestStart = document.getElementById('bestStart');
const rulesList = document.getElementById('rulesList');
const cakeView = document.getElementById('cakeView');
const cake = document.getElementById('cake');
const optionsEl = document.getElementById('options');
const rankTitle = document.getElementById('rankTitle');
const rankImg = document.getElementById('rankImg');
const rankArtist = document.getElementById('rankArtist');
const rankSpeaker = document.getElementById('rankSpeaker');
const rankLine = document.getElementById('rankLine');
const resScore = document.getElementById('resScore');
const statBest = document.getElementById('statBest');
const statPerfect = document.getElementById('statPerfect');
const statCombo = document.getElementById('statCombo');

const plateEl = document.createElement('div');
plateEl.className = 'plate';
plateEl.style.bottom = PLATE_BOTTOM + 'px';

const guide = document.createElement('i');
guide.className = 'guide';
guide.style.height = '105px';

const arrL = document.createElement('span');
arrL.className = 'arr l';
arrL.textContent = '←';

const arrR = document.createElement('span');
arrR.className = 'arr r';
arrR.textContent = '→';

let data = null;
let best = 0;
let tower = [];
let cur = null;
let curW = BASE_W;
let x = 0;
let dir = 1;
let running = false;
let paused = false;
let dropping = false;
let combo = 0;
let maxCombo = 0;
let perfectCount = 0;
let lastT = 0;
let raf = 0;
let readyAt = 0;
let W = 360;
let H = 640;
let topperImg = null;
let chosen = null;

try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0;
} catch (err) {
    best = 0;
}

function setStage(name){
    pageEl.dataset.stage = name;
    window.scrollTo(0, 0);
}

function measure(){
    const r = stagePlay.getBoundingClientRect();
    W = r.width;
    H = r.height;
}

function makeLayer(flavor, w){
    const el = document.createElement('div');
    el.className = 'cl';
    el.dataset.f = flavor;
    el.style.width = w + 'px';
    return el;
}

function towerTop(){
    return PLATE_BOTTOM + PLATE_H + tower.length * LAYER_H;
}

function camTarget(){
    return Math.min(320, H - 260);
}

function updateCamera(){
    const shift = Math.max(0, towerTop() - camTarget());
    world.style.transform = 'translateY(' + shift + 'px)';
}

function rangeX(){
    return {min: -W / 2 + EDGE, max: W / 2 - EDGE - curW};
}

function speed(){
    return Math.min(380, 170 + (tower.length - 1) * 5);
}

function applyX(){
    cur.style.setProperty('--x', x + 'px');
    guide.style.setProperty('--gx', (x + curW / 2) + 'px');
}

function placeMarkers(){
    guide.style.bottom = (towerTop() + 9) + 'px';
    arrL.style.bottom = (towerTop() + GAP_ABOVE + 4) + 'px';
    arrR.style.bottom = (towerTop() + GAP_ABOVE + 4) + 'px';
}

function updateHud(){
    const score = tower.length;
    scoreN.textContent = score;
    bestHud.textContent = Math.max(best, score);
    if (combo >= 2) {
        comboN.textContent = '×' + combo;
        comboEl.hidden = false;
    } else {
        comboEl.hidden = true;
    }
}

function popScore(){
    scoreN.classList.remove('is-pop');
    void scoreN.offsetWidth;
    scoreN.classList.add('is-pop');
}

function showPerfect(){
    perfectEl.classList.remove('is-show');
    void perfectEl.offsetWidth;
    perfectEl.classList.add('is-show');
}

function spawnMoving(){
    const top = tower[tower.length - 1];
    curW = top.w;
    cur = makeLayer(FLAVORS[tower.length % FLAVORS.length], curW);
    cur.classList.add('cur');
    cur.style.bottom = (towerTop() + GAP_ABOVE) + 'px';
    world.appendChild(cur);
    const r = rangeX();
    dir = Math.random() < 0.5 ? 1 : -1;
    x = dir > 0 ? r.min : r.max;
    applyX();
    placeMarkers();
}

function pushLayer(el, ox, w, flavor){
    el.classList.remove('cur');
    el.style.removeProperty('--x');
    el.style.width = w + 'px';
    el.style.left = 'calc(50% + ' + ox + 'px)';
    tower.push({ox, w, flavor});
}

function loop(t){
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (!running || paused || dropping) return;
    x += dir * speed() * dt;
    const r = rangeX();
    if (x >= r.max) {
        x = r.max;
        dir = -1;
    } else if (x <= r.min) {
        x = r.min;
        dir = 1;
    }
    applyX();
}

function startGame(){
    cancelAnimationFrame(raf);
    world.replaceChildren(plateEl, guide, arrL, arrR);
    tower = [];
    combo = 0;
    maxCombo = 0;
    perfectCount = 0;
    paused = false;
    dropping = false;
    running = true;
    pauseLayer.hidden = true;
    stagePlay.classList.remove('no-hint');
    setStage('play');
    measure();
    world.style.transition = 'none';
    world.style.transform = 'translateY(0px)';
    void world.offsetWidth;
    world.style.transition = '';

    const base = makeLayer(FLAVORS[0], BASE_W);
    base.style.bottom = (PLATE_BOTTOM + PLATE_H) + 'px';
    world.appendChild(base);
    pushLayer(base, -BASE_W / 2, BASE_W, FLAVORS[0]);

    updateHud();
    spawnMoving();
    lastT = performance.now();
    readyAt = lastT + 250;
    raf = requestAnimationFrame(loop);
}

function drop(){
    if (!running || paused || dropping || performance.now() < readyAt) return;
    dropping = true;
    cur.style.transition = 'bottom ' + DROP_MS + 'ms ease-in';
    cur.style.bottom = towerTop() + 'px';
    setTimeout(land, DROP_MS);
}

function cutPiece(flavor, ox, w, bottom, side){
    const el = makeLayer(flavor, w);
    el.classList.add('cut');
    el.style.left = 'calc(50% + ' + ox + 'px)';
    el.style.bottom = bottom + 'px';
    el.style.setProperty('--dx', side * 36 + 'px');
    el.style.setProperty('--rot', side * 26 + 'deg');
    world.appendChild(el);
    el.addEventListener('animationend', () => el.remove());

    const body = getComputedStyle(el).getPropertyValue('--b');
    for (let i = 0; i < 4; i++) {
        const size = 3 + Math.round(Math.random());
        const c = document.createElement('i');
        c.className = 'crumb';
        c.style.setProperty('--b', body);
        c.style.width = size + 'px';
        c.style.height = size + 'px';
        c.style.left = 'calc(50% + ' + (ox + Math.random() * w) + 'px)';
        c.style.bottom = (bottom + Math.random() * LAYER_H) + 'px';
        c.style.setProperty('--dx', side * (10 + Math.random() * 34) + 'px');
        c.style.setProperty('--dy', (80 + Math.random() * 120) + 'px');
        world.appendChild(c);
        c.addEventListener('animationend', () => c.remove());
    }
}

function land(){
    const top = tower[tower.length - 1];
    const dx = x - top.ox;
    const abs = Math.abs(dx);
    cur.style.transition = '';

    if (abs >= top.w - MIN_OVERLAP) {
        miss(dx);
        return;
    }

    const flavor = cur.dataset.f;
    const bottom = towerTop();
    const perfect = abs <= PERFECT_PX;
    let ox = top.ox;
    let w = top.w;

    if (perfect) {
        combo += 1;
        perfectCount += 1;
        maxCombo = Math.max(maxCombo, combo);
        cur.classList.add('is-perfect');
        showPerfect();
    } else {
        combo = 0;
        w = curW - abs;
        if (dx > 0) {
            ox = x;
            cutPiece(flavor, x + w, abs, bottom, 1);
        } else {
            ox = top.ox;
            cutPiece(flavor, x, abs, bottom, -1);
        }
    }

    pushLayer(cur, ox, w, flavor);
    cur = null;
    if (tower.length >= 4) stagePlay.classList.add('no-hint');
    updateHud();
    popScore();
    updateCamera();
    spawnMoving();
    dropping = false;
}

function miss(dx){
    combo = 0;
    updateHud();
    cur.style.removeProperty('left');
    cur.style.setProperty('--dir', dx > 0 ? 1 : -1);
    cur.classList.add('miss');
    guide.style.visibility = 'hidden';
    arrL.style.visibility = 'hidden';
    arrR.style.visibility = 'hidden';
    setTimeout(finishGame, 850);
}

function finishGame(){
    running = false;
    cancelAnimationFrame(raf);
    guide.style.visibility = '';
    arrL.style.visibility = '';
    arrR.style.visibility = '';
    if (tower.length > best) {
        best = tower.length;
        try {
            localStorage.setItem(BEST_KEY, String(best));
        } catch (err) {
            best = tower.length;
        }
    }
    enterTopping();
}

function setPaused(on){
    if (!running || dropping) return;
    paused = on;
    pauseLayer.hidden = !on;
    if (!on) lastT = performance.now();
}

function buildCake(){
    cake.replaceChildren();
    const plate = document.createElement('div');
    plate.className = 'plate';
    cake.appendChild(plate);
    tower.forEach((t, i) => {
        const el = makeLayer(t.flavor, t.w);
        el.style.left = 'calc(50% + ' + t.ox + 'px)';
        el.style.bottom = (PLATE_H + i * LAYER_H) + 'px';
        cake.appendChild(el);
    });
    const top = tower[tower.length - 1];
    topperImg = document.createElement('img');
    topperImg.className = 'topper';
    topperImg.alt = '';
    topperImg.style.left = 'calc(50% + ' + (top.ox + top.w / 2) + 'px)';
    topperImg.style.bottom = (PLATE_H + tower.length * LAYER_H - TOPPER_SINK) + 'px';
    cake.appendChild(topperImg);
    fitCake();
}

function fitCake(){
    const need = PLATE_H + tower.length * LAYER_H + 38;
    const s = Math.min(1, cakeView.clientHeight / need);
    cake.style.transform = 'scale(' + s + ')';
}

function choose(id, animate){
    const fruit = data.fruits.find(f => f.id === id);
    if (!fruit) return;
    chosen = fruit;
    topperImg.src = fruit.file;
    optionsEl.querySelectorAll('.opt').forEach(btn => btn.classList.toggle('is-sel', btn.dataset.id === id));
    if (animate) {
        topperImg.classList.remove('is-pop');
        void topperImg.offsetWidth;
        topperImg.classList.add('is-pop');
    }
}

function enterTopping(){
    setStage('topping');
    buildCake();
    fitCake();
    choose(data.fruits[0].id, false);
}

function showResult(){
    const score = tower.length;
    const rank = [...data.ranks].reverse().find(r => score >= r.min) || data.ranks[0];
    rankTitle.textContent = rank.title;
    rankImg.src = rank.image;
    rankArtist.textContent = rank.artist;
    rankSpeaker.textContent = rank.speaker;
    rankLine.textContent = rank.line;
    resScore.textContent = score;
    statBest.textContent = best;
    statPerfect.textContent = perfectCount;
    statCombo.textContent = '×' + maxCombo;
    setStage('result');
}

function showStart(){
    bestStart.textContent = best;
    bestRow.hidden = best === 0;
    setStage('start');
}

function buildStatic(){
    data.rules.forEach((text, i) => {
        const li = document.createElement('li');
        const no = document.createElement('span');
        no.className = 'no';
        no.textContent = String(i + 1).padStart(2, '0');
        const tx = document.createElement('span');
        tx.className = 'tx';
        tx.textContent = text;
        li.append(no, tx);
        rulesList.appendChild(li);
    });

    data.fruits.forEach(f => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.dataset.id = f.id;
        const ic = document.createElement('span');
        ic.className = 'ic';
        const img = document.createElement('img');
        img.src = f.file;
        img.alt = '';
        ic.appendChild(img);
        const nm = document.createElement('span');
        nm.className = 'nm';
        nm.textContent = f.name;
        btn.append(ic, nm);
        optionsEl.appendChild(btn);
    });
}

stagePlay.addEventListener('pointerdown', e => {
    if (e.target.closest('.pause-layer')) {
        setPaused(false);
        return;
    }
    drop();
});

pauseBtn.addEventListener('click', () => setPaused(!paused));

window.addEventListener('keydown', e => {
    if (pageEl.dataset.stage !== 'play') return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (paused) setPaused(false);
        else drop();
    } else if (e.key === 'Escape' || e.key === 'p') {
        setPaused(!paused);
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
});

window.addEventListener('resize', () => {
    const stage = pageEl.dataset.stage;
    if (stage === 'play') {
        measure();
        updateCamera();
    } else if (stage === 'topping') {
        fitCake();
    }
});

optionsEl.addEventListener('click', e => {
    const btn = e.target.closest('.opt');
    if (btn) choose(btn.dataset.id, true);
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('againBtn').addEventListener('click', startGame);
document.getElementById('doneBtn').addEventListener('click', showResult);

fetch('data/cake.json')
    .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
    })
    .then(json => {
        data = json;
        buildStatic();
        showStart();
    })
    .catch(() => setStage('error'));

const bgm = document.getElementById('bgm');
bgm.volume = 0.5;

if (window.parent === window && localStorage.getItem('bgmOn') === '1') {
    bgm.currentTime = parseFloat(localStorage.getItem('bgmTime')) || 0;

    const resume = () => {
        bgm.play().catch(() => {});
        window.removeEventListener('pointerdown', resume);
        window.removeEventListener('keydown', resume);
    };

    bgm.play().catch(() => {
        window.addEventListener('pointerdown', resume);
        window.addEventListener('keydown', resume);
    });
}

window.addEventListener('pagehide', () => {
    if (!bgm.paused) localStorage.setItem('bgmTime', bgm.currentTime);
});

if (window.parent !== window) {
    document.querySelectorAll('a[href="index.html"]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            parent.postMessage('close-page', location.origin);
        });
    });
}
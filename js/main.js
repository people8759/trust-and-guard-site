const intro = document.getElementById('intro');
const canvas = document.getElementById('dots');
const ctx = canvas.getContext('2d');

const story = document.getElementById('story');
const voice = document.getElementById('voice');
const bgm = document.getElementById('bgm');
bgm.volume = 0.5;
const enterBtn = document.getElementById('enter');

const pageFrame = document.getElementById('pageFrame');
const skipIntro = sessionStorage.getItem('introDone') === '1';

if (skipIntro) {
    intro.remove();
    story.remove();
    document.body.classList.add('home-ready');
}

// 圓點的數量
const DOT_COUNT = 40;
// 圓點漂浮多久后開始睜開眼睛動畫
const DRIFT_MS = 2500;

// 睜開眼睛后，多久開始播放語音和臺詞
const VOICE_DELAY_MS = 600;
// 臺詞停留多久后切換成立繪
const QUOTE_OUT_MS = 3200;
// 睜開眼睛后， 多久才允許點擊繼續
const READY_MS = 5400;

let ready = false;

function startStory(){
    story.classList.add('show-quote');
    
    setTimeout(() =>{
        voice.currentTime = 0;
        voice.play().catch(() => {});
    }, VOICE_DELAY_MS);

    setTimeout(() => {
        story.classList.remove('show-quote');
        story.classList.add('show-amiya');
    }, QUOTE_OUT_MS);

    setTimeout(() => {
        ready = true;
        story.classList.add('ready');
    }, READY_MS);
}

story.addEventListener('click', () => {
    if(!ready) return;
    ready = false;

    bgm.play().catch(() => {});
    localStorage.setItem('bgmOn', '1');
    sessionStorage.setItem('introDone', '1');

    // 沒有音檔也不會發生錯誤處理
    story.classList.add('leave');

    document.body.classList.add('home-ready');
    setTimeout(() => story.remove(), 1200);
});

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
        intro.classList.add("open");
        startStory();

        // 睜眼的同時開始播放臺詞和語音
        setTimeout(() => intro.remove(), 1800);
        return;
    }
    requestAnimationFrame(draw);
}

// 點擊進入，先播放語音再開始動畫
enterBtn.addEventListener('click', () => {
    enterBtn.classList.add('hide');

    voice.play().then(() => {
        voice.pause();
        voice.currentTime = 0;
    }).catch(() => {});

    requestAnimationFrame(draw);
})

window.addEventListener('pagehide', () => {
    if (!bgm.paused) localStorage.setItem('bgmTime', bgm.currentTime);
});


function resumeBgm(){
    if (localStorage.getItem('bgmOn') !== '1') return;
    bgm.currentTime = parseFloat(localStorage.getItem('bgmTime')) || 0;
    const start = () => bgm.play().catch(() => {});
    bgm.play().catch(() => {
        window.addEventListener('pointerdown', start, {once: true});
        window.addEventListener('keydown', start, {once: true});
    });
}

function openPage(url, push){
    if (!pageFrame.getAttribute('src')) pageFrame.src = url;
    pageFrame.classList.add('is-open');
    if (push) history.pushState({page: true}, '', '#character');
}

function closePage(){
    pageFrame.classList.remove('is-open');
}

document.querySelectorAll('.menu a[data-page]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        openPage(link.dataset.page, true);
    });
});

window.addEventListener('popstate', () => {
    if (location.hash === '#character') openPage('character.html', false);
    else closePage();
});

window.addEventListener('message', e => {
    if (e.origin !== location.origin) return;
    if (e.data === 'close-page') {
        closePage();
        history.replaceState(null, '', location.pathname);
    }
});

if (skipIntro) {
    resumeBgm();
    if (location.hash === '#character') openPage('character.html', false);
}
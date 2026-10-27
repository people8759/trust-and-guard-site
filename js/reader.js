const params = new URLSearchParams(location.search);
const chapterId = params.get('c') || '1';

const reader = document.getElementById('reader');
const layers = Array.from(document.querySelectorAll('.layer'));
const progressBar = document.getElementById('progressBar');
const chapterNo = document.getElementById('chapterNo');
const chapterName = document.getElementById('chapterName');
const plate = document.getElementById('plate');
const textEl = document.getElementById('text');
const autoBtn = document.getElementById('autoBtn');
const skipBtn = document.getElementById('skipBtn');
const logBtn = document.getElementById('logBtn');
const hideBtn = document.getElementById('hideBtn');
const menuBtn = document.getElementById('menuBtn');
const log = document.getElementById('log');
const logList = document.getElementById('logList');
const logClose = document.getElementById('logClose');
const sheetWrap = document.getElementById('sheetWrap');
const sheetClose = document.getElementById('sheetClose');
const bgmSwitch = document.getElementById('bgmSwitch');
const homeLink = document.getElementById('homeLink');
const music = document.getElementById('music');

const CHAR_MS = {1: 70, 2: 40, 3: 18};
const AUTO_MS = {1: 3000, 2: 2200, 3: 1500};
const SKIP_MS = 140;

const store = {
    get(key, fallback){
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (err) {
            return fallback;
        }
    },
    set(key, value){
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (err) {}
    }
};

const seenKey = 'readerSeen-' + chapterId;

const state = {
    pages: [],
    index: 0,
    seen: store.get(seenKey, 0),
    typing: false,
    auto: false,
    skip: false,
    ui: true,
    panel: null,
    textSpeed: store.get('readerTextSpeed', 2),
    autoSpeed: store.get('readerAutoSpeed', 2),
    bgm: store.get('readerBgm', true),
    finish: null
};

let typeTimer = 0;
let autoTimer = 0;
let skipTimer = 0;
let layerIndex = 0;
let currentImage = '';

function notifyParent(message){
    if (window.parent !== window) parent.postMessage(message, location.origin);
}

function leave(url){
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = url; }, 300);
}

function setImage(page){
    const key = page.image + '|' + (page.focus || '');
    if (!page.image || key === currentImage) return;
    currentImage = key;
    const next = layers[1 - layerIndex];
    next.style.setProperty('--img', 'url("' + new URL(page.image, document.baseURI).href + '")');
    next.style.setProperty('--focus', page.focus || '50% 50%');
    layers[layerIndex].classList.remove('on');
    next.classList.add('on');
    layerIndex = 1 - layerIndex;
}

function scheduleAuto(){
    clearTimeout(autoTimer);
    if (state.index >= state.pages.length - 1) {
        setAuto(false);
        return;
    }
    autoTimer = setTimeout(next, AUTO_MS[state.autoSpeed]);
}

function done(){
    state.typing = false;
    reader.dataset.done = '1';
    if (state.skip) return;
    if (state.auto && !state.panel) scheduleAuto();
}

function startTyping(full, instant){
    const chars = Array.from(full);
    const shown = document.createElement('span');
    const rest = document.createElement('span');
    rest.className = 'rest';
    textEl.replaceChildren(shown, rest);
    let count = 0;

    const paint = () => {
        shown.textContent = chars.slice(0, count).join('');
        rest.textContent = chars.slice(count).join('');
    };

    const step = () => {
        count += 1;
        paint();
        if (count >= chars.length) {
            state.finish = null;
            done();
            return;
        }
        typeTimer = setTimeout(step, CHAR_MS[state.textSpeed]);
    };

    state.typing = true;
    reader.dataset.done = '0';
    state.finish = () => {
        clearTimeout(typeTimer);
        state.finish = null;
        count = chars.length;
        paint();
        done();
    };

    if (instant) {
        state.finish();
        return;
    }
    paint();
    typeTimer = setTimeout(step, CHAR_MS[state.textSpeed]);
}

function show(index, instant){
    clearTimeout(typeTimer);
    clearTimeout(autoTimer);
    state.index = index;
    const page = state.pages[index];
    reader.classList.toggle('has-speaker', Boolean(page.speaker));
    plate.textContent = page.speaker || '';
    plate.hidden = !page.speaker;
    setImage(page);
    progressBar.style.width = ((index + 1) / state.pages.length * 100) + '%';
    if (index > state.seen) {
        state.seen = index;
        store.set(seenKey, index);
    }
    startTyping(page.text, instant);
}

function next(){
    if (state.panel) return;
    if (state.typing) {
        if (state.finish) state.finish();
        return;
    }
    if (state.index < state.pages.length - 1) show(state.index + 1);
    else leave('story.html');
}

function setAuto(on){
    state.auto = on;
    autoBtn.classList.toggle('is-on', on);
    reader.dataset.auto = on ? '1' : '0';
    clearTimeout(autoTimer);
    if (!on) return;
    setSkip(false);
    if (!state.typing && !state.panel) scheduleAuto();
}

function setSkip(on){
    if (on && state.index >= state.seen) {
        skipBtn.classList.add('is-nope');
        setTimeout(() => skipBtn.classList.remove('is-nope'), 400);
        return;
    }
    state.skip = on;
    skipBtn.classList.toggle('is-on', on);
    clearInterval(skipTimer);
    if (!on) return;
    setAuto(false);
    skipTimer = setInterval(() => {
        if (state.panel) return;
        if (state.index >= state.seen) {
            setSkip(false);
            return;
        }
        show(state.index + 1, true);
    }, SKIP_MS);
}

function setUi(on){
    state.ui = on;
    reader.dataset.ui = on ? '1' : '0';
}

function buildLog(){
    logList.replaceChildren();
    state.pages.slice(0, state.index + 1).forEach((page, i) => {
        const entry = document.createElement('div');
        entry.className = 'entry';
        if (i === state.index) entry.classList.add('is-current');
        if (page.speaker) {
            const who = document.createElement('p');
            who.className = 'who';
            who.textContent = page.speaker;
            entry.appendChild(who);
        }
        const body = document.createElement('p');
        body.className = page.speaker ? 'line' : 'line narr';
        body.textContent = page.text;
        entry.appendChild(body);
        logList.appendChild(entry);
    });
}

function syncSettings(){
    document.querySelectorAll('.seg3').forEach(group => {
        const value = state[group.dataset.setting];
        group.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('is-active', Number(btn.dataset.value) === value);
        });
    });
    bgmSwitch.classList.toggle('is-on', state.bgm);
    bgmSwitch.setAttribute('aria-checked', String(state.bgm));
}

function openPanel(name){
    state.panel = name;
    clearTimeout(autoTimer);
    if (name === 'log') {
        buildLog();
        log.classList.add('is-open');
        logList.scrollTop = logList.scrollHeight;
    } else {
        syncSettings();
        sheetWrap.classList.add('is-open');
    }
}

function closePanel(){
    if (!state.panel) return;
    state.panel = null;
    log.classList.remove('is-open');
    sheetWrap.classList.remove('is-open');
    if (state.auto && !state.typing) scheduleAuto();
}

function startMusic(){
    if (!state.bgm || !music.getAttribute('src')) return;
    music.volume = 0.5;
    const played = music.play();
    if (!played) return;
    played.catch(() => {
        const retry = () => {
            if (state.bgm) music.play().catch(() => {});
        };
        window.addEventListener('pointerdown', retry, {once: true});
        window.addEventListener('keydown', retry, {once: true});
    });
}

reader.addEventListener('click', e => {
    if (e.target.closest('.hud, .dock-row, .log, .sheet-wrap')) return;
    if (!state.ui) {
        setUi(true);
        return;
    }
    if (state.skip) {
        setSkip(false);
        return;
    }
    clearTimeout(autoTimer);
    next();
});

autoBtn.addEventListener('click', () => setAuto(!state.auto));
skipBtn.addEventListener('click', () => setSkip(!state.skip));
logBtn.addEventListener('click', () => openPanel('log'));
hideBtn.addEventListener('click', () => setUi(false));
menuBtn.addEventListener('click', () => openPanel('sheet'));
logClose.addEventListener('click', closePanel);
sheetClose.addEventListener('click', closePanel);

sheetWrap.addEventListener('click', e => {
    if (e.target === sheetWrap) closePanel();
});

document.querySelectorAll('.seg3 button').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.closest('.seg3').dataset.setting;
        state[key] = Number(btn.dataset.value);
        store.set(key === 'textSpeed' ? 'readerTextSpeed' : 'readerAutoSpeed', state[key]);
        syncSettings();
    });
});

bgmSwitch.addEventListener('click', () => {
    state.bgm = !state.bgm;
    store.set('readerBgm', state.bgm);
    syncSettings();
    if (state.bgm) startMusic();
    else music.pause();
});

document.querySelectorAll('a[data-leave]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        leave(link.getAttribute('href'));
    });
});

homeLink.addEventListener('click', e => {
    if (window.parent === window) return;
    e.preventDefault();
    parent.postMessage('close-page', location.origin);
});

window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closePanel();
        return;
    }
    if (state.panel || e.target.closest('button, a')) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (!state.ui) setUi(true);
        else next();
    }
});

window.addEventListener('pagehide', () => {
    music.pause();
    notifyParent('story-bgm-off');
});

function init(data){
    chapterNo.textContent = data.chapter;
    chapterName.textContent = data.title;
    document.title = data.title + ' | Trust and Guard';
    state.pages = data.pages;
    state.pages.forEach(page => {
        const img = new Image();
        img.src = page.image;
    });
    if (data.bgm) music.src = data.bgm;
    notifyParent('story-bgm-on');
    startMusic();
    syncSettings();
    show(0);
}

fetch('data/chapter-' + chapterId + '.json')
    .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
    })
    .then(init)
    .catch(() => {
        textEl.textContent = '章節讀取失敗，請回到上一頁再試一次。';
    });
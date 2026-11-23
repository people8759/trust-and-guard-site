const EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const YEAR_MIN = 2000;
const YEAR_MAX = 2100;
const DAY = 86400000;
const HOUR = 3600000;
const MINUTE = 60000;
const PX = 4;
const RING_R = 119;

const pageEl = document.getElementById('page');
const gateEl = document.getElementById('gate');
const stageToday = document.getElementById('stageToday');
const tlTrack = document.getElementById('tlTrack');
const tlNodes = document.getElementById('tlNodes');
const rvTitle = document.getElementById('rvTitle');
const rvDate = document.getElementById('rvDate');
const rvSub = document.getElementById('rvSub');
const rvTag = document.getElementById('rvTag');
const rvText = document.getElementById('rvText');
const rvShot = document.getElementById('rvShot');
const cdDays = document.getElementById('cdDays');
const cdH = document.getElementById('cdH');
const cdM = document.getElementById('cdM');
const cdS = document.getElementById('cdS');
const cdTitle = document.getElementById('cdTitle');
const cdDate = document.getElementById('cdDate');
const ringProg = document.getElementById('ringProg');
const ringDot = document.getElementById('ringDot');
const enterBtn = document.getElementById('enterBtn');

const daysEl = document.getElementById('days');
const rowsEl = document.getElementById('rows');
const monthEn = document.getElementById('monthEn');
const monthCn = document.getElementById('monthCn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dDate = document.getElementById('dDate');
const dTag = document.getElementById('dTag');
const dTitle = document.getElementById('dTitle');
const dSub = document.getElementById('dSub');
const dText = document.getElementById('dText');
const dImages = document.getElementById('dImages');

const pad = n => String(n).padStart(2, '0');

const loadedAt = Date.now();
const fakeParam = new URLSearchParams(location.search).get('today');
const fakeBase = fakeParam && /^\d{4}-\d{2}-\d{2}$/.test(fakeParam) ? new Date(fakeParam + 'T09:30:00').getTime() : null;

function getNow(){
    return fakeBase === null ? new Date() : new Date(fakeBase + (Date.now() - loadedAt));
}

const start = getNow();
const today = {y: start.getFullYear(), m: start.getMonth() + 1, d: start.getDate()};
const view = {y: today.y, m: today.m};

let items = [];
let sel = null;
let tickTimer = 0;
let todayTimers = [];
let todayReady = false;
let leaving = false;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function applies(item, year){
    if (item.year) return item.year === year;
    if (item.since && year < item.since) return false;
    return true;
}

function monthItems(){
    return items
        .filter(it => it.month === view.m && applies(it, view.y))
        .sort((a, b) => a.day - b.day);
}

function defaultSelection(){
    const list = monthItems();
    if (view.y === today.y && view.m === today.m) {
        const t = list.find(it => it.day === today.d);
        if (t) return {day: t.day, item: t};
    }
    return list.length ? {day: list[0].day, item: list[0]} : null;
}

function renderHead(){
    monthEn.textContent = EN[view.m - 1] + ' · ' + view.y;
    monthCn.textContent = CN[view.m - 1];
    prevBtn.disabled = view.y === YEAR_MIN && view.m === 1;
    nextBtn.disabled = view.y === YEAR_MAX && view.m === 12;
}

function renderDays(){
    const first = new Date(view.y, view.m - 1, 1).getDay();
    const total = new Date(view.y, view.m, 0).getDate();
    const list = monthItems();
    const marks = new Set(list.map(it => it.day));
    daysEl.replaceChildren();

    for (let i = 0; i < first; i++) {
        const blank = document.createElement('span');
        blank.className = 'day is-blank';
        daysEl.appendChild(blank);
    }

    for (let d = 1; d <= total; d++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day';
        btn.dataset.day = d;
        if (marks.has(d)) btn.classList.add('has-mark');
        if (view.y === today.y && view.m === today.m && d === today.d) btn.classList.add('is-today');
        if (sel && sel.day === d) {
            btn.classList.add('is-selected');
            btn.setAttribute('aria-pressed', 'true');
        }
        const names = list.filter(it => it.day === d).map(it => it.title).join('、');
        btn.setAttribute('aria-label', view.m + ' 月 ' + d + ' 日' + (names ? '，' + names : ''));
        const n = document.createElement('span');
        n.className = 'n';
        n.textContent = d;
        btn.appendChild(n);
        daysEl.appendChild(btn);
    }
}

function sinceText(item, year){
    const n = year - item.since;
    return item.since + ' 年起 · ' + (n > 0 ? '第 ' + n + ' 週年' : '在一起的第一天');
}

function makePic(image, alt){
    const fig = document.createElement('figure');
    fig.className = 'pic';
    if (image.w && image.h) {
        fig.style.setProperty('--r', image.w / image.h * 100);
        fig.style.setProperty('--ar', image.w + ' / ' + image.h);
    }
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = alt;
    fig.appendChild(img);
    if (image.artist) {
        const credit = document.createElement('span');
        credit.className = 'pic-credit';
        const lb = document.createElement('span');
        lb.className = 'lb';
        lb.textContent = 'ARTIST';
        const nm = document.createElement('span');
        nm.className = 'nm';
        nm.textContent = image.artist;
        credit.append(lb, nm);
        fig.appendChild(credit);
    }
    return fig;
}

function fillPics(box, list, alt){
    box.replaceChildren();
    if (!list || !list.length) {
        box.hidden = true;
        return;
    }
    list.forEach(image => box.appendChild(makePic(image, alt)));
    box.classList.toggle('is-pair', list.length > 1);
    box.hidden = false;
}

function renderDetail(){
    if (!sel) {
        fillPics(dImages, null);
        dDate.textContent = '—';
        dTag.hidden = true;
        dTitle.textContent = '這個月還沒有紀念日';
        dSub.hidden = true;
        dText.hidden = false;
        dText.textContent = '有新的紀念日時，會出現在這裡。';
        return;
    }

    dDate.textContent = pad(view.m) + ' / ' + pad(sel.day);

    if (!sel.item) {
        fillPics(dImages, null);
        dTag.hidden = true;
        dTitle.textContent = '這一天沒有紀念日';
        dSub.hidden = true;
        dText.hidden = false;
        dText.textContent = '點選圈起來的日子，看看那一天發生的小故事。';
        return;
    }

    const it = sel.item;
    dTag.hidden = Boolean(it.year);
    dTitle.textContent = it.title;

    if (it.since) {
        dSub.textContent = sinceText(it, view.y);
        dSub.hidden = false;
    } else {
        dSub.hidden = true;
    }

    dText.textContent = it.text || '';
    dText.hidden = !it.text;
    fillPics(dImages, it.images, it.title);
}

function renderRows(){
    rowsEl.replaceChildren();
    const list = monthItems();

    if (!list.length) {
        const li = document.createElement('li');
        const row = document.createElement('div');
        row.className = 'row is-empty';
        const title = document.createElement('span');
        title.className = 'r-title';
        title.textContent = '本月沒有紀念日';
        row.appendChild(title);
        li.appendChild(row);
        rowsEl.appendChild(li);
        return;
    }

    list.forEach(it => {
        const li = document.createElement('li');
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'row';
        if (sel && sel.item === it) row.classList.add('is-current');

        const date = document.createElement('span');
        date.className = 'r-date';
        date.textContent = pad(view.m) + '/' + pad(it.day);
        const title = document.createElement('span');
        title.className = 'r-title';
        title.textContent = it.title;
        const dot = document.createElement('span');
        dot.className = 'r-dot';

        row.append(date, title, dot);
        row.addEventListener('click', () => {
            sel = {day: it.day, item: it};
            render();
        });
        li.appendChild(row);
        rowsEl.appendChild(li);
    });
}

function render(){
    renderHead();
    renderDays();
    renderDetail();
    renderRows();
}

function shift(delta){
    let m = view.m + delta;
    let y = view.y;
    if (m < 1) {
        m = 12;
        y -= 1;
    } else if (m > 12) {
        m = 1;
        y += 1;
    }
    if (y < YEAR_MIN || y > YEAR_MAX) return;
    view.y = y;
    view.m = m;
    sel = defaultSelection();
    render();
}

prevBtn.addEventListener('click', () => shift(-1));
nextBtn.addEventListener('click', () => shift(1));

daysEl.addEventListener('click', e => {
    const btn = e.target.closest('.day');
    if (!btn || btn.classList.contains('is-blank')) return;
    const day = Number(btn.dataset.day);
    const item = monthItems().find(it => it.day === day) || null;
    sel = {day, item};
    render();
});

function startOfDay(date){
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function occurrences(fromYear, toYear){
    const list = [];
    for (let y = fromYear; y <= toYear; y++) {
        items.forEach(it => {
            if (applies(it, y)) list.push({item: it, date: new Date(y, it.month - 1, it.day)});
        });
    }
    return list.sort((a, b) => a.date - b.date);
}

function fullDate(date){
    return date.getFullYear() + ' 年 ' + (date.getMonth() + 1) + ' 月 ' + date.getDate() + ' 日 · 星期' + WEEK[date.getDay()];
}

function setStage(name){
    pageEl.dataset.stage = name;
    window.scrollTo(0, 0);
}

function clearToday(){
    todayTimers.forEach(clearTimeout);
    todayTimers = [];
}

function enterCalendar(){
    clearInterval(tickTimer);
    clearToday();
    setStage('calendar');
}

function fadeOutGate(done){
    if (leaving) return;
    if (reduceMotion.matches) {
        done();
        return;
    }
    leaving = true;
    gateEl.classList.add('is-leaving');
    setTimeout(() => {
        done();
        gateEl.classList.remove('is-leaving');
        leaving = false;
    }, 500);
}

function setPhase(name){
    stageToday.dataset.phase = name;
}

function finishToday(delay){
    clearToday();
    setPhase('reveal');
    todayTimers.push(setTimeout(() => {
        stageToday.classList.add('is-ready');
        todayReady = true;
    }, delay));
}

function buildTimeline(todayItem, occ, t0){
    tlNodes.replaceChildren();
    const entries = occ
        .map(o => ({item: o.item, dx: Math.round((o.date - t0) / DAY)}))
        .filter(e => Math.abs(e.dx) <= 150);

    let todayDone = false;
    entries.forEach(e => {
        if (e.dx === 0) {
            if (todayDone) return;
            todayDone = true;
        }
        const lone = !entries.some(o => o !== e && Math.abs(o.dx - e.dx) < 6);
        const node = document.createElement('div');
        node.className = 'node';
        node.style.left = (e.dx * PX) + 'px';

        if (e.dx === 0) {
            node.classList.add('is-today');
            ['t-glow', 't-trail t2', 't-trail t1', 't-ring', 't-dot'].forEach(c => {
                const i = document.createElement('i');
                i.className = c;
                node.appendChild(i);
            });
        } else {
            const dot = document.createElement('i');
            dot.className = 'nd';
            node.appendChild(dot);
            if (!lone) node.classList.add('is-cluster');
        }

        if (e.dx === 0 || lone) {
            const label = document.createElement('span');
            label.className = 'nl';
            label.textContent = pad(e.item.month) + '/' + pad(e.item.day);
            const title = document.createElement('span');
            title.className = 'nt';
            title.textContent = e.item.title;
            node.append(label, title);
        }

        tlNodes.appendChild(node);
    });
}

function playToday(todayItem, occ, t0){
    clearToday();
    todayReady = false;
    stageToday.classList.remove('is-ready');

    rvTitle.textContent = todayItem.title;
    rvDate.textContent = fullDate(t0);
    rvTag.hidden = Boolean(todayItem.year);
    if (todayItem.since) {
        rvSub.textContent = sinceText(todayItem, t0.getFullYear());
        rvSub.hidden = false;
    } else {
        rvSub.hidden = true;
    }
    rvText.textContent = todayItem.text || '';
    rvText.hidden = !todayItem.text;
    fillPics(rvShot, todayItem.images, todayItem.title);

    buildTimeline(todayItem, occ, t0);
    setStage('today');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        tlTrack.style.transition = 'none';
        tlTrack.style.setProperty('--x', (stageToday.clientWidth / 2) + 'px');
        finishToday(0);
        return;
    }

    const width = stageToday.clientWidth;
    setPhase('slide');
    tlTrack.style.transition = 'none';
    tlTrack.style.setProperty('--x', (width + 140) + 'px');
    void tlTrack.offsetWidth;
    requestAnimationFrame(() => {
        tlTrack.style.transition = '';
        tlTrack.style.setProperty('--x', (width / 2) + 'px');
    });

    todayTimers.push(setTimeout(() => setPhase('settle'), 1500));
    todayTimers.push(setTimeout(() => setPhase('reveal'), 3300));
    todayTimers.push(setTimeout(() => {
        stageToday.classList.add('is-ready');
        todayReady = true;
    }, 4800));
}

function leaveToday(){
    if (leaving) return;
    if (!todayReady) {
        finishToday(700);
        return;
    }
    clearToday();
    fadeOutGate(() => {
        const now = getNow();
        showCountdown(occurrences(now.getFullYear() - 1, now.getFullYear() + 2), startOfDay(now));
    });
}

stageToday.addEventListener('click', leaveToday);
stageToday.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        leaveToday();
    }
});

let cd = null;

function tick(){
    const now = getNow();
    const diff = Math.max(0, cd.next.date - now);
    cdDays.textContent = Math.floor(diff / DAY);
    cdH.textContent = pad(Math.floor(diff % DAY / HOUR));
    cdM.textContent = pad(Math.floor(diff % HOUR / MINUTE));
    cdS.textContent = pad(Math.floor(diff % MINUTE / 1000));

    const span = cd.next.date - cd.prev;
    const p = Math.min(1, Math.max(0, (now - cd.prev) / span));
    const circ = 2 * Math.PI * RING_R;
    ringProg.style.strokeDasharray = (circ * p) + ' ' + circ;
    const a = -Math.PI / 2 + Math.PI * 2 * p;
    ringDot.setAttribute('cx', 120 + RING_R * Math.cos(a));
    ringDot.setAttribute('cy', 120 + RING_R * Math.sin(a));

    if (diff <= 0) {
        clearInterval(tickTimer);
        startFlow();
    }
}

function showCountdown(occ, t0){
    const next = occ.find(o => o.date > t0);
    if (!next) {
        enterCalendar();
        return;
    }
    const before = occ.filter(o => o.date <= t0);
    const prev = before.length ? before[before.length - 1].date : new Date(next.date.getTime() - 365 * DAY);
    cd = {next, prev};

    cdTitle.textContent = next.item.title;
    cdDate.textContent = fullDate(next.date);
    setStage('countdown');
    clearInterval(tickTimer);
    tick();
    tickTimer = setInterval(tick, 1000);
}

function startFlow(){
    const now = getNow();
    const t0 = startOfDay(now);
    const occ = occurrences(now.getFullYear() - 1, now.getFullYear() + 2);
    if (!occ.length) {
        enterCalendar();
        return;
    }
    const todays = occ.filter(o => o.date.getTime() === t0.getTime());
    if (todays.length) playToday(todays[0].item, occ, t0);
    else showCountdown(occ, t0);
}

enterBtn.addEventListener('click', () => fadeOutGate(enterCalendar));

fetch('data/anniversaries.json')
    .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
    })
    .then(data => {
        items = data.items;
        sel = defaultSelection();
        render();
        startFlow();
    })
    .catch(() => {
        dTitle.textContent = '紀念日讀取失敗';
        dText.textContent = '請重新整理頁面再試一次。';
        dTag.hidden = true;
        dSub.hidden = true;
        setStage('calendar');
    });

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
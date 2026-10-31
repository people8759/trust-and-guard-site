const EN = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const CN = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const YEAR_MIN = 2000;
const YEAR_MAX = 2100;

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

const pad = n => String(n).padStart(2, '0');

const now = new Date();
const today = {y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate()};
const view = {y: today.y, m: today.m};

let items = [];
let sel = null;

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

function renderDetail(){
    if (!sel) {
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
        const n = view.y - it.since;
        dSub.textContent = it.since + ' 年起 · ' + (n > 0 ? '第 ' + n + ' 週年' : '在一起的第一天');
        dSub.hidden = false;
    } else {
        dSub.hidden = true;
    }

    dText.textContent = it.text || '';
    dText.hidden = !it.text;
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

fetch('data/anniversaries.json')
    .then(res => {
        if (!res.ok) throw new Error(res.status);
        return res.json();
    })
    .then(data => {
        items = data.items;
        sel = defaultSelection();
        render();
    })
    .catch(() => {
        dTitle.textContent = '紀念日讀取失敗';
        dText.textContent = '請重新整理頁面再試一次。';
        dTag.hidden = true;
        dSub.hidden = true;
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
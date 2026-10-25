const card = document.getElementById('artCard');
const segs = document.querySelectorAll('.seg');

segs.forEach(btn => {
    btn.addEventListener('click', () => {
        card.dataset.view = btn.dataset.view;
        segs.forEach(b => b.classList.toggle('is-active', b === btn));
    });
});

const thumb = document.getElementById('videoThumb');

function playVideo(){
    const frame = document.createElement('iframe');
    frame.src = 'https://player.bilibili.com/player.html?isOutside=true&aid=953449871&bvid=BV1xs4y1u7wn&cid=40913536987&p=1&t=8.59&autoplay=1&danmaku=0';
    frame.allowFullscreen = true;
    frame.setAttribute('scrolling', 'no');
    thumb.replaceChildren(frame);
    thumb.removeAttribute('role');
    thumb.removeAttribute('tabindex');
    thumb.style.cursor = 'default';
}

if (thumb) {
    thumb.addEventListener('click', playVideo, {once: true});
    thumb.addEventListener('keydown', e => {
        if (e.key === 'Enter') playVideo();
    }, {once: true});
}


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

document.querySelectorAll('[data-zoom]').forEach(el => {
    el.addEventListener('click', () => {
        const box = document.createElement('div');
        box.className = 'lightbox';
        const img = document.createElement('img');
        img.src = el.querySelector('img').src;
        box.appendChild(img);
        box.addEventListener('click', () => box.remove());
        document.body.appendChild(box);
    });
});

document.querySelectorAll('a.tab').forEach(link => {
    link.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(() => { location.href = link.href; }, 220);
    });
});

window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));

document.querySelectorAll('.sec').forEach(sec => {
    const title = sec.querySelector('.sec-title');
    if (!title) return;

    const body = document.createElement('div');
    body.className = 'sec-body';
    const inner = document.createElement('div');
    inner.className = 'sec-inner';
    while (title.nextSibling) inner.appendChild(title.nextSibling);
    body.appendChild(inner);
    sec.appendChild(body);

    const startCollapsed = !sec.hasAttribute('data-open');

    title.setAttribute('role', 'button');
    title.tabIndex = 0;

    const apply = collapsed => {
        sec.classList.toggle('is-collapsed', collapsed);
        title.setAttribute('aria-expanded', String(!collapsed));
        inner.inert = collapsed;
        document.dispatchEvent(new Event('foldchange'));
    };

    sec.setCollapsed = apply;

    const toggle = () => {
        const next = !sec.classList.contains('is-collapsed');
        apply(next);
    };

    apply(startCollapsed);
    title.addEventListener('click', toggle);
    title.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });
});

const tabsRow = document.querySelector('.tabs');

if (tabsRow) {
    const ctl = document.createElement('div');
    ctl.className = 'fold-ctl';
    ctl.innerHTML = '<button type="button" data-fold="open">全部展開</button><button type="button" data-fold="close">全部收合</button>';
    tabsRow.after(ctl);

    const secs = [...document.querySelectorAll('.sec')].filter(s => s.setCollapsed);
    const btnOpen = ctl.querySelector('[data-fold="open"]');
    const btnClose = ctl.querySelector('[data-fold="close"]');

    const refresh = () => {
        const collapsedCount = secs.filter(s => s.classList.contains('is-collapsed')).length;
        btnOpen.classList.toggle('is-off', collapsedCount === 0);
        btnClose.classList.toggle('is-off', collapsedCount === secs.length);
    };

    ctl.addEventListener('click', e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const collapse = btn.dataset.fold === 'close';
        secs.forEach(s => s.setCollapsed(collapse));
        if (collapse) ctl.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    });

    document.addEventListener('foldchange', refresh);
    refresh();
}
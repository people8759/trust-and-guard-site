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
    frame.src = 'https://player.bilibili.com/player.html?bvid=BV1xs4y1u7wn&page=1&t=8.59&autoplay=1&danmaku=0';
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
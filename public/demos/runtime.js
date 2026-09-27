/*
 * The runtime behind the landing-page demos in each app's /public/demos.
 *
 * A demo module default-exports { width, height, total, poster, css, html,
 * setup(ctx), mobile? } where setup returns seek(t), a pure function of time.
 * The same module runs live on the landing page (mount, in a shadow root,
 * looping while visible) and frame by frame under the content machine's
 * renderer (render.html), so the page and the social cut share one source.
 *
 * This file compiles to dependency-free ESM that a browser loads as-is: each
 * app commits a copy at public/demos/runtime.js (npm run sync:demos) and a
 * test there fails when the copy drifts from the installed package. The app's
 * own kit.js wraps mount() with its window chrome, base CSS and sidebar theme.
 */
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const eo = (x) => 1 - Math.pow(1 - clamp01(x), 3);
export const eio = (x) => {
    x = clamp01(x);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const typed = (s, t, t0, cps = 34) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));
export const spin = (t) => '◐◓◑◒'[Math.floor(t * 8) % 4];
export const money = (v, dp = 2) => '$' +
    v.toLocaleString('en-US', {
        minimumFractionDigits: dp,
        maximumFractionDigits: dp,
    });
export function rise(el, p, dy = 40) {
    el.style.opacity = String(p);
    el.style.transform = `translateY(${(1 - p) * dy}px)`;
}
/* Opacity for an element whose content changes at `at`: dips through 0.15 over `d` seconds. */
export const dip = (t, at, d = 0.3) => Math.min(1, 0.15 + 0.85 * (Math.abs(t - at) / (d / 2)));
/*
 * Change a label or badge without a one-frame pop: before `at` it shows `a`,
 * after it `b` (text, and optional class names), with an opacity dip across
 * the change. With `a` null only the dip applies, for text set elsewhere.
 */
export function swap(el, t, at, a, b, cls) {
    const after = t >= at;
    if (a != null)
        el.textContent = after ? (b !== null && b !== void 0 ? b : '') : a;
    if (cls)
        el.className = after ? cls[1] : cls[0];
    el.style.opacity = String(dip(t, at));
    return after;
}
/* A badge that moves through states at `times`: texts[k] and classes[k], dipping at each change. */
export function steps(el, t, times, texts, classes) {
    let k = 0;
    times.forEach((x) => (k += t >= x ? 1 : 0));
    if (texts)
        el.textContent = texts[k];
    if (classes)
        el.className = classes[k];
    el.style.opacity = String(Math.min(1, ...times.map((x) => dip(t, x))));
    return k;
}
/* Headline entrance: blur to sharp, rising, as p goes 0 to 1. */
export function blurIn(el, p, dy = 24) {
    const e = eo(p);
    el.style.opacity = String(clamp01(p * 1.4));
    el.style.filter = e < 1 ? `blur(${(1 - e) * 14}px)` : '';
    el.style.transform = `translateY(${(1 - e) * dy}px)`;
}
/*
 * A slow camera push over the loop toward (ox, oy), in stage px, easing back
 * before the loop wraps, so no screen sits still like a slide.
 */
export function push(el, t, total, ox, oy, amount = 0.04) {
    const k = amount *
        eio(seg(t, 0.4, total - 1.2)) *
        (1 - eio(seg(t, total - 1.2, total)));
    el.style.transformOrigin = `${ox}px ${oy}px`;
    el.style.transform = `scale(${1 + k})`;
}
/* A drawn pointer that travels from `from` to the centre of `el`, presses, and fades out. */
export function pointer(ctx, cur, el, t, t0, t1, { from = [260, 160], out = 0.6, } = {}) {
    if (t < t0 - 0.15 || t > t1 + out) {
        cur.style.opacity = '0';
        return t > t1;
    }
    const r = ctx.rel(el);
    const tx = r.x + r.w * 0.55;
    const ty = r.y + r.h * 0.55;
    const m = eio(seg(t, t0, t1));
    cur.style.left = tx + (1 - m) * from[0] + 'px';
    cur.style.top = ty + (1 - m) * from[1] + 'px';
    cur.style.opacity = String(seg(t, t0 - 0.15, t0) * (1 - seg(t, t1 + out - 0.2, t1 + out)));
    const pressed = t > t1 && t < t1 + 0.18;
    cur.style.transform = `scale(${pressed ? 0.85 : 1})`;
    return t > t1;
}
/* The stage's own reset; everything else, including the tokens, comes from the app. */
const STAGE_CSS = `
:host { display: block; }
.stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; overflow: hidden; }
:where(.stage *) { box-sizing: border-box; margin: 0; padding: 0; }
`;
function makeCtx(root, stage, getScale, theme) {
    const $ = (id) => root.getElementById(id);
    const rel = (el) => {
        const s = stage.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const k = getScale();
        return {
            x: (r.left - s.left) / k,
            y: (r.top - s.top) / k,
            w: r.width / k,
            h: r.height / k,
        };
    };
    /* ring `hl` (absolutely positioned in its offsetParent) around `target` */
    const ring = (hl, target, p, pad = 6) => {
        const parent = hl.offsetParent;
        // a hidden scene has no layout to measure; skip rather than throw
        if (!parent) {
            hl.style.opacity = '0';
            return;
        }
        const a = rel(target);
        const b = rel(parent);
        // a camera push scales the parent; undo it so the ring sits in its local px
        const k = b.w / parent.offsetWidth || 1;
        hl.style.left = (a.x - b.x) / k - pad + 'px';
        hl.style.top = (a.y - b.y) / k - pad * 0.7 + 'px';
        hl.style.width = a.w / k + pad * 2 + 'px';
        hl.style.height = a.h / k + pad * 1.4 + 'px';
        hl.style.opacity = String(p);
    };
    /* slide the pill of the sidebar inside `scope` to `k`, blending from `from` by m */
    const nav = (k, from = k, m = 1, scope = root) => {
        if (!theme)
            return;
        const side = scope.querySelector(theme.side);
        if (!side)
            return;
        const item = (key) => side.querySelector(`[data-k="${key}"]`);
        const y = (key) => { var _a, _b; return (_b = (_a = item(key)) === null || _a === void 0 ? void 0 : _a.offsetTop) !== null && _b !== void 0 ? _b : 0; };
        const pill = side.querySelector('.pill');
        if (pill)
            pill.style.top = y(from) + (y(k) - y(from)) * eio(m) + 'px';
        // the active item's colour blends across the move instead of switching
        const w = eio(m);
        side.querySelectorAll('.nv').forEach((d) => {
            var _a;
            const key = d.dataset.k;
            const on = (key === k ? w : 0) + (key === from && from !== k ? 1 - w : 0);
            const rest = d.classList.contains('sub')
                ? ((_a = theme.restSub) !== null && _a !== void 0 ? _a : theme.rest)
                : theme.rest;
            const c = rest.map((v, i) => Math.round(v + (theme.active[i] - v) * on));
            d.classList.remove('on');
            d.style.color = `rgb(${c.join(',')})`;
        });
    };
    return { $, root, stage, rel, ring, nav };
}
/* The phone layout of a demo: its `mobile` block overrides the stage size and adds CSS. */
export function variant(def, phone) {
    if (!phone || !def.mobile)
        return def;
    return Object.assign(Object.assign(Object.assign({}, def), def.mobile), { css: (def.css || '') + (def.mobile.css || '') });
}
/* Phones: screens narrower than Tailwind's sm breakpoint get a demo's phone layout. */
const PHONE = '(max-width: 639px)';
/*
 * Mount a demo into `host` (a shadow root keeps its CSS off the page). With
 * autoplay it scales to the host's width, uses the phone layout on narrow
 * screens, loops while on screen, and holds the poster frame for reduced
 * motion; without, it sits at native size for the renderer (`phone` picks the
 * phone layout there).
 */
export function mount(host, def, { autoplay = true, phone = false, css = '', theme } = {}) {
    var _a;
    const root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    let scale = 1;
    let v = def;
    let stage;
    let seek = () => { };
    const build = (isPhone) => {
        v = variant(def, isPhone);
        root.innerHTML = `<style>${STAGE_CSS}${css}${v.css || ''}</style>
    <div class="stage" style="width:${v.width}px;height:${v.height}px">${v.html}</div>`;
        stage = root.querySelector('.stage');
        const ctx = makeCtx(root, stage, () => scale, theme);
        // each window's pill starts under the item its chrome marked active, so a
        // demo that never calls nav() does not show it on the first item
        if (theme)
            root.querySelectorAll(theme.side).forEach((side) => {
                const on = side.querySelector('.nv.on');
                if ((on === null || on === void 0 ? void 0 : on.dataset.k) && side.parentNode)
                    ctx.nav(on.dataset.k, on.dataset.k, 1, side.parentNode);
            });
        const pose = v.setup(ctx);
        // [data-loop] content fades in at the start of the loop and out at its end,
        // so the wrap back to the first frame is a dissolve, not a jump.
        const looped = [...root.querySelectorAll('[data-loop]')];
        const total = v.total;
        seek = (t) => {
            pose(t);
            const f = Math.min(seg(t, 0, 0.35), 1 - seg(t, total - 0.35, total));
            looped.forEach((el) => (el.style.opacity = String(f)));
        };
    };
    const poster = (_a = def.poster) !== null && _a !== void 0 ? _a : 0;
    if (!autoplay) {
        build(phone);
        seek(poster);
        return { seek: (t) => seek(t), destroy() { } };
    }
    const phoneQuery = matchMedia(PHONE);
    const fit = () => {
        scale = host.clientWidth / v.width || 1;
        stage.style.transform = `scale(${scale})`;
    };
    build(phoneQuery.matches);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(host);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let t = poster;
    let started = false;
    let last = null;
    let raf = 0;
    let visible = false;
    seek(t);
    const loop = (now) => {
        if (last != null)
            t = (t + Math.min(0.1, (now - last) / 1000)) % def.total;
        last = now;
        seek(t);
        raf = requestAnimationFrame(loop);
    };
    const update = () => {
        cancelAnimationFrame(raf);
        last = null;
        if (reduce.matches) {
            t = poster;
            seek(t);
            return;
        }
        if (visible && !document.hidden) {
            if (!started) {
                started = true;
                t = 0;
            }
            raf = requestAnimationFrame(loop);
        }
        else
            seek(t);
    };
    const relayout = () => {
        build(phoneQuery.matches);
        fit();
        update();
    };
    const io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        update();
    }, { threshold: 0.2 });
    io.observe(host);
    document.addEventListener('visibilitychange', update);
    reduce.addEventListener('change', update);
    phoneQuery.addEventListener('change', relayout);
    return {
        seek: (x) => seek(x),
        destroy() {
            cancelAnimationFrame(raf);
            io.disconnect();
            ro.disconnect();
            document.removeEventListener('visibilitychange', update);
            reduce.removeEventListener('change', update);
            phoneQuery.removeEventListener('change', relayout);
        },
    };
}

/*
 * Landing-page demo kit: the runtime and the shared RoboLedger chrome for the
 * animated product demos in /demos/*.js.
 *
 * A demo module default-exports { width, height, total, poster, css, html,
 * setup(ctx) } where setup returns seek(t), a pure function of time. The same
 * module runs live on the landing page (mount, in a shadow root, looping while
 * visible) and frame by frame under the content machine's renderer
 * (render.html), so the page and the social cut share one source.
 */

export const clamp01 = (x) => Math.max(0, Math.min(1, x))
export const seg = (t, a, b) => clamp01((t - a) / (b - a))
export const eo = (x) => 1 - Math.pow(1 - clamp01(x), 3)
export const eio = (x) => {
  x = clamp01(x)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
export const typed = (s, t, t0, cps = 34) =>
  s.slice(0, Math.max(0, Math.floor((t - t0) * cps)))
export const spin = (t) => '◐◓◑◒'[Math.floor(t * 8) % 4]
export const money = (v, dp = 2) =>
  '$' +
  v.toLocaleString('en-US', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  })

export function rise(el, p, dy = 40) {
  el.style.opacity = p
  el.style.transform = `translateY(${(1 - p) * dy}px)`
}

/* Opacity for an element whose content changes at `at`: dips through 0.15 over `d` seconds. */
export const dip = (t, at, d = 0.3) =>
  Math.min(1, 0.15 + 0.85 * (Math.abs(t - at) / (d / 2)))

/*
 * Change a label or badge without a one-frame pop: before `at` it shows `a`,
 * after it `b` (text, and optional class names), with an opacity dip across
 * the change.
 */
export function swap(el, t, at, a, b, cls) {
  const after = t >= at
  if (a != null) el.textContent = after ? b : a
  if (cls) el.className = after ? cls[1] : cls[0]
  el.style.opacity = dip(t, at)
  return after
}

/* A badge that moves through states at `times`: texts[k] and classes[k], dipping at each change. */
export function steps(el, t, times, texts, classes) {
  let k = 0
  times.forEach((x) => (k += t >= x ? 1 : 0))
  if (texts) el.textContent = texts[k]
  if (classes) el.className = classes[k]
  el.style.opacity = Math.min(1, ...times.map((x) => dip(t, x)))
  return k
}

/* Headline entrance: blur to sharp, rising, as p goes 0 to 1. */
export function blurIn(el, p, dy = 24) {
  const e = eo(p)
  el.style.opacity = clamp01(p * 1.4)
  el.style.filter = e < 1 ? `blur(${(1 - e) * 14}px)` : ''
  el.style.transform = `translateY(${(1 - e) * dy}px)`
}

/*
 * A slow camera push over the loop toward (ox, oy), in stage px, easing back
 * before the loop wraps, so no screen sits still like a slide.
 */
export function push(el, t, total, ox, oy, amount = 0.04) {
  const k =
    amount *
    eio(seg(t, 0.4, total - 1.2)) *
    (1 - eio(seg(t, total - 1.2, total)))
  el.style.transformOrigin = `${ox}px ${oy}px`
  el.style.transform = `scale(${1 + k})`
}

/* A drawn pointer that travels from `from` to the centre of `el`, presses, and fades out. */
export function pointer(
  ctx,
  cur,
  el,
  t,
  t0,
  t1,
  { from = [260, 160], out = 0.6 } = {}
) {
  if (t < t0 - 0.15 || t > t1 + out) {
    cur.style.opacity = 0
    return t > t1
  }
  const r = ctx.rel(el)
  const tx = r.x + r.w * 0.55
  const ty = r.y + r.h * 0.55
  const m = eio(seg(t, t0, t1))
  cur.style.left = tx + (1 - m) * from[0] + 'px'
  cur.style.top = ty + (1 - m) * from[1] + 'px'
  cur.style.opacity =
    seg(t, t0 - 0.15, t0) * (1 - seg(t, t1 + out - 0.2, t1 + out))
  const pressed = t > t1 && t < t1 + 0.18
  cur.style.transform = `scale(${pressed ? 0.85 : 1})`
  return t > t1
}

const NAV = [
  ['home', 'Home'],
  ['ledger', 'Ledger'],
  ['inbox', 'Inbox', true],
  ['statements', 'Statements', true],
  ['close', 'Closing Book', true],
  ['reports', 'Reports'],
  ['plan', 'Plan'],
  ['explorer', 'Explorer'],
  ['console', 'Console'],
]

export const ICON = '/images/logos/roboledger-icon.png'
export const tile = (size, radius) =>
  `<span class="tile" style="width:${size}px;height:${size}px;border-radius:${radius}px"><img src="${ICON}" alt=""></span>`

/* The RoboLedger app window: top bar, sidebar with the active item, and `main`. */
export function appChrome({
  active,
  main,
  company = 'Driftline Coffee Roasters',
  id = '',
}) {
  const nav = NAV.map(
    ([k, label, sub]) =>
      `<div class="nv${sub ? ' sub' : ''}${k === active ? ' on' : ''}" data-k="${k}">${label}</div>`
  ).join('')
  return `<div class="rl-app"${id ? ` id="${id}"` : ''}>
    <div class="rl-top">${tile(36, 10)}<span class="wm">RoboLedger</span><span class="co">${company}</span></div>
    <div class="rl-side"><div class="pill"></div>${nav}</div>
    <div class="rl-main" id="main" data-loop>${main}</div>
  </div>`
}

export const pageHeader = (title, sub) =>
  `<div class="vh">${tile(54, 13)}<div><h2>${title}</h2><p>${sub}</p></div></div>`

export const CURSOR = `<svg class="cursor" viewBox="0 0 24 24"><path d="M3 2l7 19 2.6-7.4L20 11z" fill="#fff" stroke="#000" stroke-width="1.2"/></svg>`

const CSS = `
:host { display: block; }
.stage { position: absolute; left: 0; top: 0; transform-origin: 0 0; overflow: hidden;
  --bg: #07060b; --ink: #f4f2fb; --muted: #9b97ad; --dim: #6b6780;
  --v300: #C4B5FD; --v400: #A78BFA; --v500: #8B5CF6; --v600: #7C3AED;
  --p500: #A855F7; --f400: #E879F9; --f500: #D946EF;
  --card: #141319; --card2: #1c1b22; --line: #2a2833; --row: #232229;
  --good: #34d399; --bad: #f87171; --warn: #fbbf24;
  --display: 'Orbitron', 'Space Grotesk', sans-serif;
  --body: 'Space Grotesk', system-ui, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: #000; color: var(--ink); font-family: var(--body);
  -webkit-font-smoothing: antialiased; line-height: 1.3;
  text-align: left; font-size: 16px; font-weight: 400; font-style: normal; letter-spacing: normal; text-transform: none; }
:where(.stage *) { box-sizing: border-box; margin: 0; padding: 0; }
.grad { background: linear-gradient(90deg, var(--v400), var(--p500) 50%, var(--f400));
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.tile { display: inline-grid; place-items: center; flex-shrink: 0; overflow: hidden;
  background: linear-gradient(135deg, var(--v500), var(--f500)); }
.tile img { mix-blend-mode: screen; width: 78%; height: 78%; }
.cursor { position: absolute; width: 34px; height: 34px; z-index: 40; opacity: 0; pointer-events: none;
  transform-origin: 20% 10%; }

.rl-app { position: absolute; inset: 0; background: #000; overflow: hidden; }
.rl-top { position: absolute; left: 0; right: 0; top: 0; height: 62px; border-bottom: 1px solid #1e1d24;
  display: flex; align-items: center; gap: 14px; padding: 0 22px; }
.rl-top .wm { font: 700 24px var(--display); }
.rl-top .co { margin-left: auto; padding: 8px 16px; border-radius: 10px; background: #26262e;
  border: 1px solid #34343c; font-size: 17px; font-weight: 600; }
.rl-side { position: absolute; top: 62px; bottom: 0; left: 0; width: 196px; border-right: 1px solid #1e1d24; padding: 16px 12px; }
.rl-side .nv { position: relative; font-size: 18px; padding: 10px 14px; border-radius: 10px; margin-bottom: 3px; color: #e6e4ee; }
.rl-side .nv.sub { padding-left: 30px; font-size: 17px; color: #cfcbdc; }
.rl-side .nv.on { color: var(--v600); }
.rl-side .pill { position: absolute; left: 12px; width: 172px; height: 42px; border-radius: 10px; background: #E9E3FF; }
.rl-main { position: absolute; top: 62px; left: 196px; right: 0; bottom: 0; padding: 26px 30px; }

.vh { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.vh h2 { font: 700 32px var(--display); }
.vh p { font-size: 16px; color: var(--muted); margin-top: 4px; }
table { width: 100%; border-collapse: collapse; }
th { background: #3a3940; color: #c9c6d4; font-size: 14px; letter-spacing: .06em; text-transform: uppercase;
  text-align: left; padding: 12px 16px; font-weight: 600; }
th:first-child { border-top-left-radius: 10px; } th:last-child { border-top-right-radius: 10px; }
th.n, td.n { text-align: right; }
td { background: var(--row); padding: 13px 16px; font-size: 18px; border-top: 1px solid #1a1920; }
td.n { font-family: var(--mono); font-size: 17px; }
tr.tot td { font-weight: 700; }
.tabs { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; }
.tab { padding: 9px 16px; border-radius: 9px; background: #45444c; font-size: 16px; font-weight: 600; }
.tab.on { background: var(--v600); }
.btn { display: inline-block; padding: 10px 20px; border-radius: 10px; font-size: 17px; font-weight: 600; }
.btn.go { background: linear-gradient(90deg, var(--v600), var(--p500)); color: #fff; }
.btn.ghost { border: 1px solid var(--line); color: var(--muted); }
.badge { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 15px; font-weight: 700; }
.b-good { background: rgba(52,211,153,.15); color: var(--good); }
.b-warn { background: rgba(251,191,36,.15); color: var(--warn); }
.b-v { background: rgba(167,139,250,.18); color: var(--v300); }
.b-mute { background: #2e2d35; color: #cfcbdc; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; }
.hl { position: absolute; border: 2px solid var(--f400); border-radius: 10px;
  pointer-events: none; opacity: 0; z-index: 5; }

.ub { align-self: flex-end; max-width: 520px; background: #2a2340; border: 1px solid #3b3158;
  border-radius: 22px 22px 6px 22px; padding: 16px 22px; font-size: 26px; line-height: 1.35; min-height: 66px; }
.tool { border: 1px solid var(--line); background: var(--card); border-radius: 16px; padding: 14px 18px; }
.tool .tn { font: 600 19px var(--mono); color: var(--v300); display: flex; justify-content: space-between; }
.tool .tr { font-size: 20px; color: var(--muted); margin-top: 8px; min-height: 1px; }
.tool .st { font: 500 17px var(--mono); }
.ans { font-size: 26px; line-height: 1.45; min-height: 40px; }
.ans b { color: var(--f400); font-weight: 600; }
`

function makeCtx(root, stage, getScale) {
  const $ = (id) => root.getElementById(id)
  const rel = (el) => {
    const s = stage.getBoundingClientRect()
    const r = el.getBoundingClientRect()
    const k = getScale()
    return {
      x: (r.left - s.left) / k,
      y: (r.top - s.top) / k,
      w: r.width / k,
      h: r.height / k,
    }
  }
  /* ring `hl` (absolutely positioned in its offsetParent) around `target` */
  const ring = (hl, target, p, pad = 6) => {
    // a hidden scene has no layout to measure; skip rather than throw
    if (!hl.offsetParent) {
      hl.style.opacity = 0
      return
    }
    const a = rel(target)
    const b = rel(hl.offsetParent)
    hl.style.left = a.x - b.x - pad + 'px'
    hl.style.top = a.y - b.y - pad * 0.7 + 'px'
    hl.style.width = a.w + pad * 2 + 'px'
    hl.style.height = a.h + pad * 1.4 + 'px'
    hl.style.opacity = p
  }
  /* slide the sidebar pill to `k`, blending from `from` by m */
  const nav = (k, from = k, m = 1) => {
    const side = root.querySelector('.rl-side')
    if (!side) return
    const y = (key) => side.querySelector(`[data-k="${key}"]`).offsetTop
    side.querySelector('.pill').style.top =
      y(from) + (y(k) - y(from)) * eio(m) + 'px'
    // the active item's colour blends across the move instead of switching
    const w = eio(m)
    side.querySelectorAll('.nv').forEach((d) => {
      const key = d.dataset.k
      const on = (key === k ? w : 0) + (key === from && from !== k ? 1 - w : 0)
      const rest = d.classList.contains('sub')
        ? [207, 203, 220]
        : [230, 228, 238]
      const c = rest.map((v, i) => Math.round(v + ([124, 58, 237][i] - v) * on))
      d.classList.remove('on')
      d.style.color = `rgb(${c.join(',')})`
    })
  }
  return { $, root, stage, rel, ring, nav }
}

/* The phone layout of a demo: its `mobile` block overrides the stage size and adds CSS. */
export function variant(def, phone) {
  if (!phone || !def.mobile) return def
  return {
    ...def,
    ...def.mobile,
    css: (def.css || '') + (def.mobile.css || ''),
  }
}

/* Shared phone CSS for the app-screen spotlights: no sidebar, larger type. */
export const PHONE_APP_CSS = `
.rl-side { display: none; }
.rl-main { left: 0; padding: 20px 22px; }
.rl-top { height: 58px; } .rl-main { top: 58px; }
.rl-top .co { font-size: 15px; padding: 7px 12px; }
.vh { margin-bottom: 16px; } .vh h2 { font-size: 28px; } .vh p { font-size: 14px; }
th { padding: 10px 12px; font-size: 13px; }
td { padding: 11px 12px; font-size: 17px; } td.n { font-size: 16px; white-space: nowrap; }
`

/* Phones: screens narrower than Tailwind's sm breakpoint get a demo's phone layout. */
const PHONE = '(max-width: 639px)'

/*
 * Mount a demo into `host` (a shadow root keeps its CSS off the page). With
 * autoplay it scales to the host's width, uses the phone layout on narrow
 * screens, loops while on screen, and holds the poster frame for reduced
 * motion; without, it sits at native size for the renderer (`phone` picks the
 * phone layout there).
 */
export function mount(host, def, { autoplay = true, phone = false } = {}) {
  const root = host.shadowRoot || host.attachShadow({ mode: 'open' })
  let scale = 1
  let v
  let stage
  let seek
  const build = (isPhone) => {
    v = variant(def, isPhone)
    root.innerHTML = `<style>${CSS}${v.css || ''}</style>
    <div class="stage" style="width:${v.width}px;height:${v.height}px">${v.html}</div>`
    stage = root.querySelector('.stage')
    const pose = v.setup(makeCtx(root, stage, () => scale))
    // [data-loop] content fades in at the start of the loop and out at its end,
    // so the wrap back to the first frame is a dissolve, not a jump.
    const looped = [...root.querySelectorAll('[data-loop]')]
    const total = v.total
    seek = (t) => {
      pose(t)
      const f = Math.min(seg(t, 0, 0.35), 1 - seg(t, total - 0.35, total))
      looped.forEach((el) => (el.style.opacity = f))
    }
  }
  const poster = def.poster ?? 0

  if (!autoplay) {
    build(phone)
    seek(poster)
    return { seek: (t) => seek(t), destroy() {} }
  }

  const phoneQuery = matchMedia(PHONE)
  const fit = () => {
    scale = host.clientWidth / v.width || 1
    stage.style.transform = `scale(${scale})`
  }
  build(phoneQuery.matches)
  fit()
  const ro = new ResizeObserver(fit)
  ro.observe(host)

  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  let t = poster
  let started = false
  let last = null
  let raf = 0
  let visible = false
  seek(t)

  const loop = (now) => {
    if (last != null) t = (t + Math.min(0.1, (now - last) / 1000)) % def.total
    last = now
    seek(t)
    raf = requestAnimationFrame(loop)
  }
  const update = () => {
    cancelAnimationFrame(raf)
    last = null
    if (reduce.matches) {
      t = poster
      seek(t)
      return
    }
    if (visible && !document.hidden) {
      if (!started) {
        started = true
        t = 0
      }
      raf = requestAnimationFrame(loop)
    } else seek(t)
  }
  const relayout = () => {
    build(phoneQuery.matches)
    fit()
    update()
  }
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting
      update()
    },
    { threshold: 0.2 }
  )
  io.observe(host)
  document.addEventListener('visibilitychange', update)
  reduce.addEventListener('change', update)
  phoneQuery.addEventListener('change', relayout)

  return {
    seek: (x) => seek(x),
    destroy() {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      document.removeEventListener('visibilitychange', update)
      reduce.removeEventListener('change', update)
      phoneQuery.removeEventListener('change', relayout)
    },
  }
}

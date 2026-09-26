/*
 * Contrast: a board pack exported at the July close goes stale while August
 * happens, beside the same lines live in RoboLedger, which move as events land
 * and answer a question. Driftline demo company: the Jul 31 and Aug 31 figures
 * are its ledger; the event amounts in between are illustrative.
 */
import { blurIn, eio, eo, money, rise, seg, swap, tile, typed } from './kit.js'

const LINES = [
  ['Cash', 60411, 31166],
  ['Receivables', 107667, 153333],
  ['Inventory', 94000, 96000],
]
const EVENTS = [
  ['Invoice · Summit Markets', '+$45,000.00', 'AR'],
  ['Green coffee · Andean Importers', '−$62,000.00', 'Cash'],
  ['Payment · Pioneer Square Cafés', '+$9,120.00', 'Cash'],
]
const Q = 'Why are receivables up?'
const A = [
  'Summit Markets owes ',
  '$128K',
  ' on 90-day terms. It was 30 in the spring.',
]

const html = `
<div class="half" id="lh" data-loop>
  <div class="cap" id="capl">A photograph of your books</div>
  <div class="viewer" id="pdf">
    <div class="vbar"><span class="pdfic">PDF</span>Driftline_Board_Pack_Jul2026.pdf</div>
    <div class="paper" id="paper">
      <div class="ph">Driftline Coffee Roasters</div>
      <div class="ps">Balance Sheet (extract) · as of July 31, 2026</div>
      ${LINES.map((l, i) => `<div class="pl"><span>${l[0]}</span><b id="was${i}">${money(l[1], 0)}</b><em id="now${i}"></em></div>`).join('')}
      <div class="pf">Exported Aug 3, 2026 · 9:14 AM</div>
    </div>
  </div>
  <div class="age" id="age"></div>
</div>

<div class="half" id="rh" data-loop>
  <div class="cap grad" id="capr">A ledger you can ask</div>
  <div class="win" id="win">
    <div class="wbar">${tile(30, 8)}<span class="wm">RoboLedger</span><span class="live"><i></i>Live · <b id="asof"></b></span></div>
    <div class="wbody">
      ${LINES.map((l, i) => `<div class="wl" id="wl${i}"><span>${l[0]}</span><b id="lv${i}">${money(l[1], 0)}</b></div>`).join('')}
      <div class="feed" id="feed">${EVENTS.map((e, i) => `<div class="ev" id="ev${i}"><span>${e[0]}</span><b>${e[1]}</b></div>`).join('')}</div>
      <div class="ask" id="ask"><span class="pr">›</span><span id="q"></span></div>
      <div class="ans" id="ans"></div>
    </div>
  </div>
</div>`

const css = `
.stage { background: transparent; }
.half { position: absolute; top: 0; bottom: 0; width: 720px; }
#lh { left: 40px; } #rh { right: 40px; }
.cap { font: 700 34px var(--display); margin: 8px 0 22px; }
#lh .cap { color: #d6d3e0; }
.viewer { height: 560px; border-radius: 20px; background: #2a2930; border: 1px solid #3a3942; overflow: hidden; }
.vbar { height: 50px; display: flex; align-items: center; gap: 12px; padding: 0 18px; background: #34333b; font: 17px var(--mono); color: #cfcbdc; }
.pdfic { padding: 3px 7px; border-radius: 5px; background: #d9443b; color: #fff; font: 700 13px var(--body); }
.paper { margin: 28px auto 0; width: 600px; height: 450px; background: #f6f3ea; border-radius: 4px; padding: 34px 40px; color: #1c1b22; }
.ph { font: 700 24px var(--body); }
.ps { font-size: 16px; color: #6b6780; margin: 6px 0 22px; }
.pl { position: relative; display: flex; justify-content: space-between; padding: 14px 0; border-top: 1px solid #ddd8ca; font-size: 21px; }
.pl b { font-family: var(--mono); font-weight: 600; }
.pl em { position: absolute; right: 0; top: 0; transform: translateY(-52%); font-style: normal; white-space: nowrap;
  padding: 4px 9px; border-radius: 7px; background: #e5484d; color: #fff; font: 700 14px var(--mono); opacity: 0;
}
.pl b.stale { text-decoration: line-through; text-decoration-color: #e5484d; text-decoration-thickness: 2px; color: #8a8698; }
.pf { margin-top: 26px; font-size: 15px; color: #8a8698; }
.age { margin-top: 18px; font-size: 22px; color: var(--muted); }
.age b { color: var(--bad); }
.win { height: 560px; border-radius: 20px; background: #000; border: 1px solid var(--v500); overflow: hidden; }
.wbar { height: 58px; display: flex; align-items: center; gap: 12px; padding: 0 20px; border-bottom: 1px solid #1e1d24; }
.wbar .wm { font: 700 21px var(--display); }
.live { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 16px; color: var(--muted); }
.live i { width: 10px; height: 10px; border-radius: 50%; background: var(--good); }
.live b { color: var(--ink); font-weight: 600; }
.wbody { padding: 22px 26px; }
.wl { display: flex; justify-content: space-between; padding: 14px 16px; border-radius: 10px; font-size: 21px; background: var(--row); margin-bottom: 8px; }
.wl b { font-family: var(--mono); font-weight: 600; }
.feed { height: 104px; margin: 14px 0 12px; }
.ev { display: flex; justify-content: space-between; font-size: 16px; color: var(--muted); padding: 7px 12px; border-left: 3px solid var(--v500); margin-bottom: 4px; opacity: 0; }
.ev b { font-family: var(--mono); color: var(--ink); font-weight: 500; }
.ask { display: flex; gap: 10px; align-items: center; padding: 12px 16px; border-radius: 12px; background: #2a2340; border: 1px solid #3b3158; font-size: 20px; min-height: 50px; opacity: 0; }
.ask .pr { color: var(--v400); font-weight: 700; }
.ans { font-size: 20px; line-height: 1.4; margin-top: 12px; min-height: 30px; }
.ans b { color: var(--f400); font-weight: 600; }
`

const TOTAL = 10

const mixHex = (a, b, p) => {
  const c = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `rgb(${[0, 1, 2].map((i) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * p)).join(',')})`
}
const DAY0 = 3 // Aug 3, the export
const DAY1 = 31

function setup(ctx) {
  const { $ } = ctx
  return (t) => {
    rise($('pdf'), eo(seg(t, 0, 0.5)), 30)
    rise($('win'), eo(seg(t, 0.15, 0.65)), 30)
    blurIn($('capl'), seg(t, 0.05, 0.6))
    blurIn($('capr'), seg(t, 0.2, 0.75))

    // August passes: the photograph ages, the ledger keeps up
    const p = eio(seg(t, 0.8, 4.8))
    const day = Math.round(DAY0 + (DAY1 - DAY0) * p)
    $('age').innerHTML = `Today: Aug ${day} · <b>${day - DAY0} days old</b>`
    // the page yellows as it ages: authored colours, not a filter
    $('paper').style.background = mixHex('#f6f3ea', '#ddd3b8', p)
    $('asof').textContent = `Aug ${day}, 2026`
    EVENTS.forEach((_, i) =>
      rise($('ev' + i), eo(seg(t, 1.4 + i * 1.1, 1.8 + i * 1.1)), 10)
    )
    LINES.forEach((l, i) => {
      $('lv' + i).textContent = money(l[1] + (l[2] - l[1]) * p, 0)
      // the line an event lands on lights up and settles back
      const key = i === 0 ? 'Cash' : i === 1 ? 'AR' : ''
      const hit = Math.max(
        0,
        ...EVENTS.map((e, k) => {
          if (e[2] !== key) return 0
          const at = 1.4 + k * 1.1
          return seg(t, at, at + 0.2) * (1 - seg(t, at + 0.6, at + 0.9))
        })
      )
      $('wl' + i).style.boxShadow = `inset 0 0 0 2px rgba(139,92,246,${hit})`
      const nw = $('now' + i)
      if (i < 2) {
        nw.textContent = 'now ' + money(l[2], 0)
        nw.style.opacity = eo(seg(t, 5.0 + i * 0.25, 5.4 + i * 0.25))
        swap($('was' + i), t, 5.2 + i * 0.25, null, null, ['', 'stale'])
      }
    })

    rise($('ask'), eo(seg(t, 5.4, 5.8)), 10)
    $('q').textContent = typed(Q, t, 5.6, 30)
    const n = Math.max(0, Math.floor((t - 6.6) * 60))
    let left = n
    $('ans').innerHTML = A.map((s, i) => {
      const part = s.slice(0, Math.max(0, left))
      left -= s.length
      return i === 1 ? `<b>${part}</b>` : part
    }).join('')
  }
}

// Phone layout: larger type in a narrower stage.
const phoneCss = `
#lh { left: 20px; top: 0; width: 680px; }
#rh { left: 20px; right: auto; top: 530px; width: 680px; }
.cap { font-size: 28px; margin: 4px 0 12px; }
.viewer { height: 400px; }
.vbar { height: 44px; font-size: 15px; }
.paper { margin-top: 20px; width: 580px; height: 320px; padding: 24px 30px; }
.ph { font-size: 21px; } .ps { font-size: 14px; margin: 4px 0 14px; }
.pl { font-size: 19px; padding: 10px 0; }
.age { margin-top: 10px; font-size: 19px; }
.win { height: 470px; }
.wbar { height: 52px; }
.wbody { padding: 16px 18px; }
.wl { font-size: 19px; padding: 10px 14px; margin-bottom: 6px; }
.feed { height: 96px; margin: 10px 0; }
.ev { font-size: 15px; padding: 5px 10px; }
.ask { font-size: 18px; padding: 10px 14px; min-height: 44px; }
.ans { font-size: 18px; margin-top: 8px; }
`

export default {
  width: 1600,
  height: 720,
  total: TOTAL,
  poster: 8.5,
  css,
  html,
  setup,
  mobile: { width: 720, height: 1060, css: phoneCss },
}

/*
 * Spotlight: Plan forward from the books you just closed. Actuals and forecast
 * in one monthly grid; a person switches from the base scenario to one where
 * Summit Markets pays in 30 days (a scenario authored from the AI chat over
 * MCP; the app switches scenarios in place but has no assumption editor yet)
 * and the forecast columns roll. The assumptions are rows of the same grid, in a
 * section of their own, with a value per forecast month, as the Plan page draws them. Jun to Aug are Driftline's ledger; Sep
 * to Nov are the plan, and illustrative.
 */
import {
  appChrome,
  CURSOR,
  eio,
  eo,
  pageHeader,
  PHONE_APP_CSS,
  pointer,
  push,
  seg,
  swap,
} from './kit.js'

const COLS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
// [label, actual Jun..Aug, forecast Sep..Nov (90-day terms), forecast (30-day terms), bold]
const ROWS = [
  ['Revenue', [125400, 134600, 136800], [139000, 141200, 143400], null],
  ['Gross profit', [75400, 74600, 76800], [79000, 81200, 83400], null],
  ['Net income', [19029, 12862, 17667], [19500, 20900, 21800], null, 1],
  [
    'Receivables',
    [100000, 107667, 153333],
    [161000, 168000, 175000],
    [144000, 120000, 106000],
  ],
  [
    'Cash',
    [73111, 60411, 31166],
    [41000, 44000, 48000],
    [58000, 92000, 117000],
    1,
  ],
]
const k = (v) => '$' + Math.round(v / 100) / 10 + 'K'
// [label, the actual months (measured from the books), each forecast month before the
// switch, after it (null when unchanged)]. Jun has no growth: the grid starts there.
const LEVERS = [
  ['Revenue growth', ['·', '7.3%', '1.6%'], ['1.6%', '1.6%', '1.6%']],
  ['Gross margin', ['60.1%', '55.4%', '56.1%'], ['56.8%', '57.5%', '58.2%']],
  [
    'Summit payment terms',
    ['90 days', '90 days', '90 days'],
    ['90 days', '90 days', '90 days'],
    ['30 days', '30 days', '30 days'],
  ],
]

const main = `${pageHeader('Plan', 'Actuals and forecast in one grid, driven by the assumptions beneath')}
  <div class="scn"><span class="lbl">Scenario</span><span class="badge b-v" id="scn">Base ▾</span>
    <div class="menu card" id="menu"><div>Base</div><div id="alt">Summit on 30-day terms</div></div></div>
  <table id="grid">
    <tr><th></th>${COLS.map((c, i) => `<th class="n${i > 2 ? ' fc' : ''}">${c}${i === 3 ? '<em>forecast</em>' : ''}</th>`).join('')}</tr>
    ${ROWS.map((r, ri) => `<tr${r[4] ? ' class="tot"' : ''}><td>${r[0]}</td>${r[1].map((v) => `<td class="n">${k(v)}</td>`).join('')}${r[2].map((v, ci) => `<td class="n fc" id="c${ri}_${ci}">${k(v)}</td>`).join('')}</tr>`).join('')}
    <tr class="sec"><td colspan="7">Assumptions</td></tr>
    ${LEVERS.map(
      (l, li) =>
        `<tr class="lv"><td>${l[0]}</td>${l[1].map((v) => `<td class="n${v === '·' ? ' na' : ' hist'}">${v}</td>`).join('')}${l[2].map((v, ci) => `<td class="n fc" id="l${li}_${ci}">${v}</td>`).join('')}</tr>`
    ).join('')}
  </table>
  <div class="src" id="src">Scenario authored from your AI chat</div>`

const css = `
.scn { position: absolute; right: 30px; top: 40px; display: flex; align-items: center; gap: 10px; }
.scn .lbl { color: var(--muted); font-size: 15px; }
#grid td.fc, #grid th.fc { background: #26222f; }
#grid th em { display: block; font-style: normal; font-size: 11px; color: var(--f400); letter-spacing: .08em; }
#grid td { padding: 12px 16px; }
#grid tr.sec td { background: #3a3940; color: #c9c6d4; font-size: 13px; letter-spacing: .08em;
  text-transform: uppercase; font-weight: 600; padding: 9px 16px; }
#grid tr.lv td { font-size: 16px; padding: 10px 16px; }
#grid tr.lv td.na { color: var(--dim); }
#grid tr.lv td.hist { color: var(--muted); }
.scn { flex-wrap: wrap; justify-content: flex-end; }
.menu { position: absolute; right: 0; top: 40px; width: 250px; padding: 6px; opacity: 0; z-index: 3; box-shadow: 0 16px 40px rgba(0,0,0,.6); }
.menu div { font-size: 15px; padding: 8px 10px; border-radius: 7px; }
.src { font-size: 14px; color: var(--dim); margin-top: 10px; opacity: 0; }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('plan')
  return (t) => {
    pointer(ctx, $('cur'), $('scn'), t, 1.0, 1.6, { out: 0 })
    pointer(ctx, $('cur2'), $('alt'), t, 1.75, 2.35, {
      from: [0, -60],
    })
    $('menu').style.opacity =
      eo(seg(t, 1.6, 1.75)) * (1 - eo(seg(t, 2.35, 2.5)))
    $('alt').style.background = `rgba(139,92,246,${0.25 * seg(t, 1.85, 2.0)})`
    // The lever that changes, month by month, a beat ahead of the rows it drives
    const ring = seg(t, 2.35, 2.6) * (1 - seg(t, 5.2, 5.6))
    LEVERS.forEach((l, li) => {
      if (!l[3]) return
      l[2].forEach((before, ci) => {
        const cell = $(`l${li}_${ci}`)
        swap(cell, t, 2.35 + ci * 0.12, before, l[3][ci])
        cell.style.boxShadow = `inset 0 0 0 2px rgba(232,121,249,${ring})`
        cell.style.color = t >= 2.35 + ci * 0.12 ? 'var(--f400)' : ''
      })
    })
    $('src').style.opacity = eo(seg(t, 2.6, 3.0))
    const roll = eio(seg(t, 2.8, 4.0))
    ROWS.forEach((r, ri) => {
      if (!r[3]) return
      r[2].forEach((base, ci) => {
        const p = clamp(roll * 1.6 - ci * 0.3)
        const cell = $(`c${ri}_${ci}`)
        cell.textContent = k(base + (r[3][ci] - base) * p)
        cell.style.color =
          p > 0.02 ? (r[0] === 'Cash' ? 'var(--good)' : 'var(--v300)') : ''
      })
    })
    swap($('scn'), t, 2.35, 'Base ▾', 'Summit on 30-day terms ▾')
    push($('main'), t, 9, 620, 260)
  }
}
const clamp = (x) => Math.max(0, Math.min(1, x))

// Phone layout: larger type in a narrower stage.
const phoneCss = `
.vh p { display: none; }
#grid td { padding: 10px 8px; font-size: 15px; } #grid th { padding: 9px 8px; }
.scn { right: 22px; top: 30px; } .scn .lbl { display: none; }
.menu { width: 230px; }
#grid tr.lv td { font-size: 14px; padding: 8px; } #grid tr.sec td { padding: 8px; }
`

export default {
  width: 1200,
  height: 750,
  total: 9,
  poster: 6,
  css,
  html:
    appChrome({ active: 'plan', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"') +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur2"'),
  setup,
  mobile: { width: 720, height: 740, css: PHONE_APP_CSS + phoneCss },
}

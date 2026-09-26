/*
 * Spotlight: Plan forward from the books you just closed. Actuals and forecast
 * in one monthly grid; a person switches from the base scenario to one where
 * Summit Markets pays in 30 days (a scenario authored from the AI chat over
 * MCP; the app switches scenarios in place but has no assumption editor yet)
 * and the forecast columns roll. Jun to Aug are Driftline's ledger; Sep
 * to Nov are the plan, and illustrative.
 */
import { appChrome, CURSOR, eio, eo, pageHeader, pointer, seg } from './kit.js'

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

const main = `${pageHeader('Plan', 'Actuals and forecast in one grid, driven by the assumptions beneath')}
  <div class="scn"><span class="lbl">Scenario</span><span class="badge b-v" id="scn">Base ▾</span>
    <div class="menu card" id="menu"><div>Base</div><div id="alt">Summit on 30-day terms</div></div></div>
  <table id="grid">
    <tr><th></th>${COLS.map((c, i) => `<th class="n${i > 2 ? ' fc' : ''}">${c}${i === 3 ? '<em>forecast</em>' : ''}</th>`).join('')}</tr>
    ${ROWS.map((r, ri) => `<tr${r[4] ? ' class="tot"' : ''}><td>${r[0]}</td>${r[1].map((v) => `<td class="n">${k(v)}</td>`).join('')}${r[2].map((v, ci) => `<td class="n fc" id="c${ri}_${ci}">${k(v)}</td>`).join('')}</tr>`).join('')}
  </table>
  <div class="card asm">
    <div class="ah">Assumptions</div>
    <div class="ar"><span>Revenue growth</span><b>1.6% / month</b></div>
    <div class="ar"><span>Gross margin</span><b>57%</b></div>
    <div class="ar" id="terms"><span>Summit Markets payment terms</span><b id="tv">90 days</b></div>
    <div class="src" id="src">Scenario authored from your AI chat</div>
  </div>`

const css = `
.scn { position: absolute; right: 30px; top: 40px; display: flex; align-items: center; gap: 10px; }
.scn .lbl { color: var(--muted); font-size: 15px; }
#grid td.fc, #grid th.fc { background: #26222f; }
#grid th em { display: block; font-style: normal; font-size: 11px; color: var(--f400); letter-spacing: .08em; }
#grid td { padding: 12px 16px; }
.asm { margin-top: 18px; padding: 14px 20px; }
.ah { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
.ar { display: flex; justify-content: space-between; font-size: 17px; padding: 8px 0; border-top: 1px solid var(--line); }
.ar b { font-family: var(--mono); font-weight: 600; }
.flash { box-shadow: inset 0 0 0 2px var(--f400); }
.scn { flex-wrap: wrap; justify-content: flex-end; }
.menu { position: absolute; right: 0; top: 40px; width: 250px; padding: 6px; opacity: 0; z-index: 3; box-shadow: 0 16px 40px rgba(0,0,0,.6); }
.menu div { font-size: 15px; padding: 8px 10px; border-radius: 7px; }
.menu div.hov { background: rgba(139,92,246,.25); color: var(--v300); }
.src { font-size: 13px; color: var(--dim); margin-top: 6px; opacity: 0; }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('plan')
  return (t) => {
    const opened = pointer(ctx, $('cur'), $('scn'), t, 1.0, 1.6, { out: 0 })
    const picked = pointer(ctx, $('cur2'), $('alt'), t, 1.75, 2.35, {
      from: [0, -60],
    })
    $('menu').style.opacity = opened && !picked ? 1 : 0
    $('alt').className = t > 1.9 && !picked ? 'hov' : ''
    const alt = picked
    $('tv').textContent = alt ? '30 days' : '90 days'
    $('terms').className = 'ar' + (alt && t < 5.5 ? ' flash' : '')
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
    $('scn').textContent = alt ? 'Summit on 30-day terms ▾' : 'Base ▾'
    $('scn').style.opacity = eo(seg(t, 0, 0.3))
  }
}
const clamp = (x) => Math.max(0, Math.min(1, x))

export default {
  width: 1200,
  height: 750,
  total: 9,
  poster: 6,
  label:
    'The RoboLedger plan grid rolling Driftline forward from actuals as one payment-terms assumption changes.',
  css,
  html:
    appChrome({ active: 'plan', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"') +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur2"'),
  setup,
}

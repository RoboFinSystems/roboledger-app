/*
 * Spotlight: Open up any number and see how it was built. The Gross Margin
 * block, toggled through its projections: rendered, chart, facts, validation.
 * Driftline demo company, FY ending 2026-08-31; monthly margins from the ledger.
 */
import { appChrome, CURSOR, eo, pageHeader, pointer, seg } from './kit.js'

const VIEWS = ['Rendered', 'Chart', 'Facts', 'Elements', 'Validation', 'Rules']
const MONTHS = [
  ['Mar', 59.1],
  ['Apr', 58.7],
  ['May', 59.4],
  ['Jun', 60.1],
  ['Jul', 55.4],
  ['Aug', 56.1],
]
const PICKS = [
  [1, 1.6],
  [2, 4.4],
  [4, 7.2],
] // [view index, click time]

const main = `${pageHeader('Explorer', 'Every statement, schedule and metric is an Information Block')}
  <div class="ex">
    <div class="card blocks">
      <div class="bh">Statements</div><div class="bi">Income Statement</div><div class="bi">Balance Sheet</div>
      <div class="bh">Metrics</div><div class="bi on">Gross Margin</div><div class="bi">Revenue Growth</div>
      <div class="bh">Schedules</div><div class="bi">Roasting Line Depreciation</div>
    </div>
    <div class="pane">
      <div class="bt"><b>Gross Margin</b><span>FY2026 · 58.6%</span></div>
      <div class="tabs">${VIEWS.map((v, i) => `<span class="tab" id="vt${i}">${v}</span>`).join('')}</div>
      <div class="vw" id="v0"><table>
        <tr><th>Line</th><th class="n">FY2026</th></tr>
        <tr><td>Revenues</td><td class="n">$1,226,399.87</td></tr>
        <tr><td>Cost of Revenue</td><td class="n">$508,000.00</td></tr>
        <tr class="tot"><td>Gross Profit</td><td class="n">$718,399.87</td></tr>
        <tr class="tot"><td>Gross Margin</td><td class="n" style="color:var(--f400)">58.6%</td></tr>
      </table></div>
      <div class="vw" id="v1"><div class="bars">${MONTHS.map((m, i) => `<div class="bar"><em id="bv${i}">${m[1]}%</em><i id="b${i}"></i><span>${m[0]}</span></div>`).join('')}</div></div>
      <div class="vw" id="v2"><table class="facts">
        <tr><th>Element</th><th>Period</th><th class="n">Value</th><th>Source</th></tr>
        <tr><td>rs-gaap:Revenues</td><td>FY2026</td><td class="n">1,226,399.87</td><td>ledger</td></tr>
        <tr><td>rs-gaap:CostOfRevenue</td><td>FY2026</td><td class="n">508,000.00</td><td>ledger</td></tr>
        <tr><td>rs-gaap:GrossProfit</td><td>FY2026</td><td class="n">718,399.87</td><td>derived</td></tr>
      </table></div>
      <div class="vw" id="v4">
        <div class="rule"><span class="badge b-good">✓</span>Gross Profit = Revenues − Cost of Revenue</div>
        <div class="rule"><span class="badge b-good">✓</span>Cost of Revenue ties to trial balance</div>
        <div class="rule"><span class="badge b-good">✓</span>Every fact maps to one element</div>
        <div class="rule"><span class="badge b-good">✓</span>Periods align with the fiscal calendar</div>
      </div>
    </div>
  </div>`

const css = `
.ex { display: grid; grid-template-columns: 250px 1fr; gap: 22px; }
.blocks { padding: 12px; }
.bh { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 10px 8px 6px; }
.bi { font-size: 16px; padding: 9px 10px; border-radius: 8px; }
.bi.on { background: rgba(139,92,246,.22); color: var(--v300); font-weight: 600; }
.pane { position: relative; }
.bt { display: flex; align-items: baseline; gap: 14px; margin-bottom: 12px; }
.bt b { font-size: 24px; } .bt span { color: var(--muted); font-size: 16px; }
.tab { padding: 8px 13px; font-size: 15px; }
.vw { position: absolute; left: 0; right: 0; top: 104px; opacity: 0; }
.bars { height: 300px; display: flex; align-items: flex-end; gap: 26px; padding: 0 12px; border-bottom: 1px solid var(--line); }
.bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
.bar i { width: 100%; border-radius: 8px 8px 0 0; background: linear-gradient(180deg, var(--f400), var(--v600)); }
.bar em { font-style: normal; font-family: var(--mono); font-size: 15px; margin-bottom: 8px; }
.bar span { position: absolute; bottom: -30px; color: var(--muted); font-size: 15px; }
.bar { position: relative; }
.facts td { font-size: 15px; } .facts td:first-child { font-family: var(--mono); color: var(--v300); }
.rule { display: flex; align-items: center; gap: 14px; font-size: 18px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('explorer')
  return (t) => {
    let cur = 0
    let at = 0
    PICKS.forEach(([vi, tc], i) => {
      if (
        pointer(ctx, $('cur' + i), $('vt' + vi), t, tc - 0.6, tc, {
          from: [-120, 140],
          out: 0.4,
        })
      ) {
        cur = vi
        at = tc
      }
    })
    VIEWS.forEach(
      (_, i) => ($('vt' + i).className = 'tab' + (i === cur ? ' on' : ''))
    )
    ;[0, 1, 2, 4].forEach((i) => {
      const v = $('v' + i)
      const p = i === cur ? eo(seg(t, at, at + 0.35)) : 0
      v.style.opacity = i === 0 && cur === 0 ? 1 : p
      v.style.transform = `translateY(${(1 - (i === 0 && cur === 0 ? 1 : p)) * 12}px)`
    })
    if (cur === 1) {
      MONTHS.forEach((m, i) => {
        const g = eo(seg(t, at + 0.1 + i * 0.1, at + 0.7 + i * 0.1))
        $('b' + i).style.height = ((m[1] - 40) / 25) * 240 * g + 'px'
        $('bv' + i).style.opacity = g
      })
    }
  }
}

export default {
  width: 1200,
  height: 750,
  total: 10,
  poster: 8.4,
  label:
    'The RoboLedger Explorer opening the Gross Margin block through its rendered, chart, facts and validation views.',
  css,
  html:
    appChrome({ active: 'explorer', main }) +
    [0, 1, 2]
      .map((i) =>
        CURSOR.replace('class="cursor"', `class="cursor" id="cur${i}"`)
      )
      .join(''),
  setup,
}

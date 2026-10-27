/*
 * Spotlight: a group of companies, consolidated. The worksheet fills company by
 * company, the drafted adjustments are named one at a time, the consolidated
 * column lands, and a person closes the group's month. Driftline's real August
 * 2026 worksheet (consolidation-worksheet), rounded to the dollar: Harbor Café
 * is 70% owned, Pier Market Kiosk 40% on the equity method.
 */
import {
  appChrome,
  CURSOR,
  dip,
  eo,
  pageHeader,
  PHONE_APP_CSS,
  pointer,
  push,
  rise,
  seg,
  steps,
  swap,
} from './kit.js'

const COLS = [
  ['Roasters', 'mc'],
  ['Café LLC', 'mc'],
  ['Harbor Café 70%', 'mc'],
  ['Combined', ''],
  ['Adjustments', 'adj'],
  ['Consolidated', 'con'],
]
// Costs read positive and the outside owners' share is deducted, as on the statement.
const ROWS = [
  ['Revenues', [135830, 21400, 19600, 176830, -1230, 175600]],
  ['Cost of revenue', [60000, 5200, 6100, 71300, 0, 71300]],
  ['Operating expenses', [61738, 9442, 8488, 79668, -1230, 78438]],
  ['Interest, net', [25, -25, 0, 0, 0, 0]],
  ['Share of Pier Market 40%', [0, 0, 0, 0, 1080, 1080]],
  ["Outside owners' share", [0, 0, 0, 0, 1504, 1504]],
  ['Net income', [14117, 6733, 5012, 25862, -424, 25438], 1],
]
const fmt = (v) =>
  v === 0
    ? '–'
    : v < 0
      ? `(${(-v).toLocaleString('en-US')})`
      : v.toLocaleString('en-US')

// What each drafted adjustment is, ringed on its cell in turn: [row, note].
const NOTES = [
  [
    0,
    'Business the companies did with each other: $1,230 out of revenue and expense',
  ],
  [
    4,
    "Pier Market Kiosk, held 40%: the group's share of its $2,700, not its revenue",
  ],
  [
    5,
    "Harbor Café's outside owners: 30% of its $5,012, as noncontrolling interest",
  ],
]
const CHECKS = [
  '4 of 4 companies closed',
  'Entries drafted',
  'Nothing unexplained',
  'Statements tie',
]

// Column reveal times: the three companies, combined, the adjustments, consolidated.
const REVEAL = [1.5, 1.8, 2.1, 2.6, 3.3, 7.3]
const TOTAL = 12.5

const main = `${pageHeader('Live Statements', 'Driftline Coffee Roasters group · August 2026')}
  <div class="tabs" id="tabs"><span class="tab">This entity</span><span class="tab">Combined</span><span class="tab" id="tc">Consolidated</span><span class="tab" id="tw">Worksheet</span>
    <span class="badge b-mute" id="dr" style="margin-left:auto">Adjustments</span></div>
  <div class="ws" id="ws"><div class="hl" id="hl"></div>
    <table><tr><th>Income statement</th>${COLS.map((c, i) => `<th class="n ${c[1]}"><span class="v" id="h${i}">${c[0]}</span></th>`).join('')}</tr>
    ${ROWS.map(
      (r, ri) =>
        `<tr${r[2] ? ' class="tot"' : ''}><td>${r[0]}</td>${r[1].map((v, ci) => `<td class="n ${COLS[ci][1]}" id="c${ri}_${ci}"><span class="v" id="v${ri}_${ci}">${fmt(v)}</span></td>`).join('')}</tr>`
    ).join('')}
    </table></div>
  <div class="slot">
    <div class="card note" id="nt"><span class="badge b-v">Drafted by your AI</span><span id="ntx"></span></div>
    <div class="card gclose" id="gc">
      <div class="gl"><b>Close the group · August 2026</b>
        <div class="chk">${CHECKS.map((c, i) => `<span class="badge b-mute" id="k${i}">${c}</span>`).join('')}</div></div>
      <span class="btn go" id="cp">Close the group</span>
    </div>
  </div>`

const css = `
.ws { position: relative; }
.ws th { font-size: 12px; padding: 10px 10px; line-height: 1.25; }
.ws td { padding: 10px 10px; font-size: 16px; }
.ws td.n { font-size: 15px; white-space: nowrap; }
.ws .v { display: inline-block; }
.ws th:first-child, .ws td:first-child { width: 228px; }
.ws td.adj, .ws th.adj { color: var(--v300); }
.ws tr.tot td.con { color: var(--f400); }
.slot { position: relative; height: 96px; margin-top: 16px; }
.slot .card { position: absolute; inset: 0; padding: 16px 20px; display: flex; align-items: center; gap: 18px; opacity: 0; }
.note span:last-child { font-size: 18px; }
.gl b { font-size: 19px; display: block; margin-bottom: 10px; }
.chk { display: flex; gap: 8px; flex-wrap: wrap; } .chk .badge { font-size: 13px; padding: 5px 10px; }
.gclose .btn { margin-left: auto; white-space: nowrap; }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('statements')
  // the figures fade in, not the cells, so the table keeps its rows while it fills
  const cells = (ci) => [$('h' + ci), ...ROWS.map((_, ri) => $(`v${ri}_${ci}`))]
  return (t) => {
    rise($('tabs'), eo(seg(t, 0.1, 0.5)), 12)
    pointer(ctx, $('cur'), $('tw'), t, 0.6, 1.3)
    swap($('tc'), t, 1.3, null, null, ['tab on', 'tab'])
    swap($('tw'), t, 1.3, null, null, ['tab', 'tab on'])
    REVEAL.forEach((at, ci) => {
      const p = eo(seg(t, at, at + 0.45))
      cells(ci).forEach((el) => rise(el, p, 10))
    })
    steps(
      $('dr'),
      t,
      [3.3],
      ['Adjustments', 'Adjustments drafted'],
      ['badge b-mute', 'badge b-v']
    )
    push($('main'), t, TOTAL, 640, 300)

    // The drafted adjustments, one at a time, then the note gives way to the close.
    const k =
      t < 3.8 ? 0 : Math.min(NOTES.length - 1, Math.floor((t - 3.8) / 1.15))
    const at = 3.8 + k * 1.15
    $('ntx').textContent = NOTES[k][1]
    $('ntx').style.opacity = String(k > 0 ? dip(t, at) : 1)
    const noteOn = eo(seg(t, 3.6, 4.0)) * (1 - seg(t, 7.3, 7.7))
    rise($('nt'), noteOn, 12)
    ctx.ring($('hl'), $(`c${NOTES[k][0]}_4`), t > 3.8 && t < 7.3 ? noteOn : 0)

    rise($('gc'), eo(seg(t, 7.8, 8.2)), 12)
    CHECKS.forEach((_, i) =>
      steps($('k' + i), t, [8.4 + i * 0.3], null, [
        'badge b-mute',
        'badge b-good',
      ])
    )
    pointer(ctx, $('cur2'), $('cp'), t, 9.7, 10.3, { from: [-220, 120] })
    swap($('cp'), t, 10.4, 'Close the group', 'Closed ✓')
    $('cp').style.opacity = (0.4 + 0.6 * eo(seg(t, 9.3, 9.6))) * dip(t, 10.4)
  }
}

// Phone layout: the three companies give way to combined, adjustments and consolidated.
const phoneCss = `
.ws .mc { display: none; }
.ws th:first-child, .ws td:first-child { width: auto; }
.ws td { font-size: 15px; } .ws td.n { font-size: 14px; }
.tabs { flex-wrap: wrap; gap: 8px; } .tab { font-size: 13px; padding: 7px 10px; }
#dr { display: none; }
.slot { height: 150px; }
.slot .card { flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
.note span:last-child { font-size: 16px; }
.gl b { font-size: 16px; }
.gclose .btn { margin-left: 0; font-size: 15px; padding: 8px 14px; }
`

export default {
  width: 1200,
  height: 750,
  total: TOTAL,
  poster: 11.5,
  css,
  html:
    appChrome({ active: 'statements', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"') +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur2"'),
  setup,
  mobile: { width: 720, height: 740, css: PHONE_APP_CSS + phoneCss },
}

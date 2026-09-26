/*
 * Spotlight: Live statements & validated reports. Balance sheet, a click to the
 * income statement, then a report package walking Draft, Under Review, Filed.
 * Figures: Driftline demo company, FY ending 2026-08-31.
 */
import { appChrome, CURSOR, eo, pageHeader, pointer, rise, seg } from './kit.js'

const BS = [
  ['Cash and Cash Equivalents', '$31,166.49', '$71,944.40'],
  ['Receivables, Net, Current', '$153,333.33', '$17,333.33'],
  ['Inventory, Net', '$96,000.00', '$22,000.00'],
  ['Prepaid Expense, Current', '$11,000.00', '$15,500.00'],
  ['Assets, Current', '$291,499.82', '$126,777.73', 1],
  ['Property, Plant and Equipment, Net', '$67,000.12', '$56,785.74'],
  ['Assets', '$358,499.94', '$183,563.47', 1],
]
const IS = [
  ['Revenues', '$1,226,399.87', '$189,599.96'],
  ['Cost of Revenue', '$508,000.00', '$84,000.00'],
  ['Gross Profit', '$718,399.87', '$105,599.96', 1],
  ['Operating Expenses', '$556,685.62', '$96,814.26'],
  ['Operating Income', '$161,714.25', '$8,785.70', 1],
  ['Net Income', '$161,714.25', '$8,785.70', 1],
]
const rows = (list, h1, h2) =>
  `<tr><th>Concept</th><th class="n">${h1}</th><th class="n">${h2}</th></tr>` +
  list
    .map(
      (r) =>
        `<tr${r[3] ? ' class="tot"' : ''}><td>${r[0]}</td><td class="n">${r[1]}</td><td class="n">${r[2]}</td></tr>`
    )
    .join('')

const STEPS = ['Draft', 'Under Review', 'Filed']

const main = `${pageHeader('Live Statements', 'Render BS / IS / CF from the current ledger, no close required')}
  <div class="tabs"><span class="tab on" id="tb">Balance Sheet</span><span class="tab" id="ti">Income Statement</span><span class="tab">Cash Flow</span>
    <span class="btn go" id="mk" style="margin-left:auto">Create report</span></div>
  <div class="tblwrap"><table id="bs">${rows(BS, 'Aug 31, 2026', 'Aug 31, 2025')}</table>
    <table id="is">${rows(IS, 'FY2026', 'FY2025')}</table></div>
  <div class="card rep" id="rep">
    <div><b>FY2026 Annual Statements</b><span>Balance Sheet · Income Statement · Cash Flow</span></div>
    <div class="steps">${STEPS.map((s, i) => `<span class="badge b-mute" id="st${i}">${s}</span>`).join('<i>›</i>')}</div>
    <span class="badge b-mute" id="xb">XBRL 2.1</span>
  </div>`

const css = `
.tblwrap { position: relative; height: 420px; }
.tblwrap table { position: absolute; left: 0; right: 0; top: 0; }
.rep { position: absolute; left: 30px; right: 30px; bottom: 26px; padding: 18px 22px; display: flex; align-items: center; gap: 22px; opacity: 0; }
.rep b { font-size: 20px; } .rep span:not(.badge) { display: block; color: var(--muted); font-size: 15px; margin-top: 4px; }
.steps { margin-left: auto; display: flex; align-items: center; gap: 8px; } .steps i { color: var(--dim); font-style: normal; }
`

const TOTAL = 11

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('statements')
  return (t) => {
    const onIS = pointer(ctx, $('cur'), $('ti'), t, 1.6, 2.3)
    const x = eo(seg(t, 2.3, 2.7))
    $('bs').style.opacity = 1 - x
    $('is').style.opacity = x
    $('tb').className = 'tab' + (onIS ? '' : ' on')
    $('ti').className = 'tab' + (onIS ? ' on' : '')
    const made = pointer(ctx, $('cur2'), $('mk'), t, 4.6, 5.3, {
      from: [-200, 180],
    })
    rise($('rep'), made ? eo(seg(t, 5.4, 5.9)) : 0, 30)
    const stage = t < 6.6 ? 0 : t < 7.8 ? 1 : 2
    STEPS.forEach((_, i) => {
      const b = $('st' + i)
      b.className =
        'badge ' +
        (i < stage
          ? 'b-v'
          : i === stage
            ? i === 2
              ? 'b-good'
              : 'b-warn'
            : 'b-mute')
    })
    const valid = t > 8.4
    $('xb').className = 'badge ' + (valid ? 'b-good' : 'b-mute')
    $('xb').textContent = valid ? 'XBRL 2.1 ✓ valid' : 'XBRL 2.1'
  }
}

export default {
  width: 1200,
  height: 750,
  total: TOTAL,
  poster: 9.5,
  label:
    'RoboLedger rendering a balance sheet and income statement live from the ledger, then filing a validated report package.',
  css,
  html:
    appChrome({ active: 'statements', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"') +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur2"'),
  setup,
}

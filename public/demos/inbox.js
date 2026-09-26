/*
 * Spotlight: An inbox for your books. A customer payment lands captured, the
 * AI classifies it, the preview shows the planned entry, and a person commits
 * it. Driftline demo company, August 2026.
 */
import { appChrome, CURSOR, eo, pageHeader, pointer, rise, seg } from './kit.js'

const ROWS = [
  [
    'Aug 28',
    'Andean Green Coffee Importers',
    '−$62,000.00',
    'Inventory — Green Coffee',
    'committed',
  ],
  [
    'Aug 15',
    'Shipwise Fulfillment',
    '−$8,700.00',
    'Fulfillment & Shipping',
    'committed',
  ],
  [
    'Aug 1',
    'Ballard Industrial Properties',
    '−$6,500.00',
    'Roastery Rent',
    'committed',
  ],
]

const row = (r, id = '') =>
  `<tr${id ? ` id="${id}"` : ''}><td>${r[0]}</td><td>${r[1]}</td><td class="n">${r[2]}</td>
   <td>${r[3]}</td><td><span class="badge b-good">${r[4]}</span></td></tr>`

const main = `${pageHeader('Inbox', 'Every transaction lands as an event: captured, classified, committed')}
  <div class="wrap">
    <table id="list">
      <tr><th>Date</th><th>Counterparty</th><th class="n">Amount</th><th>Account</th><th>Status</th></tr>
      <tr id="nr"><td>Aug 31</td><td>Pioneer Square Cafés</td><td class="n" style="color:var(--good)">+$8,440.00</td>
        <td id="acct"><span class="muted">unclassified</span></td><td><span class="badge" id="st"></span></td></tr>
      ${ROWS.map((r) => row(r)).join('')}
    </table>
    <div class="card pv" id="pv">
      <div class="pvh">Preview · planned entry</div>
      <div class="je"><span>DR</span><b>Operating Checking</b><em>$8,440.00</em></div>
      <div class="je"><span>CR</span><b>Accounts Receivable — Wholesale</b><em>$8,440.00</em></div>
      <div class="pvf"><span class="badge b-good">✓ balanced</span><span class="hand">Handler: customer payment</span></div>
      <div class="pvb"><span class="btn go" id="cm">Commit</span><span class="btn ghost">Reject</span></div>
    </div>
  </div>`

const css = `
.wrap { position: relative; }
#list td { font-size: 16px; padding: 12px 14px; } #list th { padding: 11px 14px; }
.muted { color: var(--dim); font-style: italic; }
.ai { display: inline-block; margin-right: 8px; padding: 2px 7px; border-radius: 6px; font-size: 12px; font-weight: 700;
  background: linear-gradient(90deg, var(--v600), var(--f500)); color: #fff; vertical-align: 2px; }
.pv { position: absolute; right: 0; top: 282px; width: 470px; padding: 18px 20px; opacity: 0; box-shadow: 0 24px 60px rgba(0,0,0,.6); }
.pvh { font-size: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }
.je { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; font-size: 16px; padding: 8px 0; border-top: 1px solid var(--line); }
.je span { color: var(--v300); font-weight: 700; } .je em { font-style: normal; font-family: var(--mono); }
.pvf { display: flex; align-items: center; gap: 12px; margin-top: 12px; } .hand { color: var(--muted); font-size: 14px; }
.pvb { display: flex; gap: 10px; margin-top: 14px; }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('inbox')
  return (t) => {
    rise($('nr'), eo(seg(t, 0.4, 0.9)), -20)
    const classified = t > 2.0
    $('acct').innerHTML =
      t < 1.3
        ? '<span class="muted">unclassified</span>'
        : `<span class="ai">AI</span>Accounts Receivable — Wholesale`
    $('acct').style.opacity = t < 1.3 ? 1 : eo(seg(t, 1.3, 1.7))
    rise($('pv'), eo(seg(t, 2.6, 3.1)), 20)
    const committed = pointer(ctx, $('cur'), $('cm'), t, 4.4, 5.1)
    const st = $('st')
    st.textContent = committed
      ? 'committed'
      : classified
        ? 'classified'
        : 'captured'
    st.className =
      'badge ' + (committed ? 'b-good' : classified ? 'b-v' : 'b-warn')
    $('cm').textContent = committed ? 'Committed ✓' : 'Commit'
    if (committed) $('pv').style.opacity = 1 - eo(seg(t, 6.6, 7.1))
  }
}

export default {
  width: 1200,
  height: 750,
  total: 9.5,
  poster: 3.8,
  label:
    'A customer payment arriving in the RoboLedger inbox, classified by AI, previewed as a balanced entry, and committed by a person.',
  css,
  html:
    appChrome({ active: 'inbox', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"'),
  setup,
}

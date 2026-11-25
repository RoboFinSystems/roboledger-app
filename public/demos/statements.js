/*
 * Spotlight: Live statements & reports. Balance sheet, a click to the income
 * statement, a report package walking Draft, Under Review, Filed, then the cut to
 * the report's own page and its download menu (the formats the app offers, in its
 * order), ending on the DataBook. Figures: Driftline demo company, FY ending
 * 2026-08-31.
 */
import {
  appChrome,
  CURSOR,
  eio,
  eo,
  pageHeader,
  PHONE_APP_CSS,
  pointer,
  rise,
  seg,
  steps,
  swap,
} from './kit.js'

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

const statementsPage = `${pageHeader('Live Statements', 'Render BS / IS / CF from the current ledger, no close required')}
  <div class="tabs"><span class="tab on" id="tb">Balance Sheet</span><span class="tab" id="ti">Income Statement</span><span class="tab">Cash Flow</span>
    <span class="btn go" id="mk" style="margin-left:auto">Create report</span></div>
  <div class="tblwrap"><table id="bs">${rows(BS, 'Aug 31, 2026', 'Aug 31, 2025')}</table>
    <table id="is">${rows(IS, 'FY2026', 'FY2025')}</table></div>
  <div class="card rep" id="rep">
    <div><b>FY2026 Annual Statements</b><span>Balance Sheet · Income Statement · Cash Flow</span></div>
    <div class="steps">${STEPS.map((s, i) => `<span class="badge b-mute" id="st${i}">${s}</span>`).join('<i>›</i>')}</div>
  </div>`

// The report page: header, actions menu (the app's ⋮), and its Download group, labels
// as src/app/(app)/reports/[id]/content.tsx has them.
const FORMATS = [
  'Tavi (JSON)',
  'Holon (JSON-LD)',
  'Holon with lineage (JSON-LD)',
  'DataBook (Markdown)',
  'XBRL 2.1 package',
]
const reportPage = `${pageHeader('FY2026 Annual Statements', 'Balance Sheet · Income Statement · Cash Flow · Driftline Coffee Roasters')}
  <div class="rhead"><span class="badge b-good">Filed</span><span class="badge b-v">Published</span>
    <span class="dots" id="dots">⋮</span></div>
  <div class="menu card" id="menu"><div class="mh">Download</div>
    ${FORMATS.map((f, i) => `<div class="mi" id="f${i}">${f}</div>`).join('')}
    <div class="msep"></div><div class="mi dim">Share</div><div class="mi dim">Manage shares</div></div>
  <div class="tblwrap short"><table>${rows(IS, 'FY2026', 'FY2025')}</table></div>
  <div class="toast card" id="toast">Downloading driftline-fy2026.databook.md</div>`

const main = `<div class="pg" id="pa">${statementsPage}</div><div class="pg" id="pb">${reportPage}</div>`

const css = `
.tblwrap { position: relative; height: 420px; }
.tblwrap table { position: absolute; left: 0; right: 0; top: 0; }
.rep { position: absolute; left: 30px; right: 30px; bottom: 26px; padding: 18px 22px; display: flex; align-items: center; gap: 22px; opacity: 0; }
.rep b { font-size: 20px; } .rep span:not(.badge) { display: block; color: var(--muted); font-size: 15px; margin-top: 4px; }
.steps { margin-left: auto; display: flex; align-items: center; gap: 8px; } .steps i { color: var(--dim); font-style: normal; }
.rl-main { padding: 0; }
.pg { position: absolute; inset: 0; padding: 26px 30px; }
#pb { opacity: 0; }
.rhead { position: absolute; top: 40px; right: 30px; display: flex; gap: 10px; align-items: center; z-index: 4; }
.dots { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 10px;
  border: 1px solid var(--line); background: var(--card2); font-size: 22px; font-weight: 700; }
.menu { position: absolute; top: 88px; right: 30px; width: 330px; padding: 8px; z-index: 6; opacity: 0;
  box-shadow: 0 18px 40px rgba(0,0,0,.55); }
.mh { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--dim); padding: 8px 12px 6px; }
.mi { font-size: 17px; padding: 9px 12px; border-radius: 8px; }
.mi.on { background: #2a2340; color: var(--v300); }
.mi.dim { color: var(--muted); }
.msep { height: 1px; background: var(--line); margin: 6px 4px; }
.tblwrap.short { height: auto; } .tblwrap.short table { position: static; }
.toast { position: absolute; left: 30px; bottom: 26px; padding: 14px 18px; font-size: 17px; opacity: 0; }
`

const TOTAL = 14.5

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('statements')
  return (t) => {
    pointer(ctx, $('cur'), $('ti'), t, 1.6, 2.3)
    const x = eo(seg(t, 2.3, 2.7))
    $('bs').style.opacity = 1 - x
    $('is').style.opacity = x
    swap($('tb'), t, 2.3, null, null, ['tab on', 'tab'])
    swap($('ti'), t, 2.3, null, null, ['tab', 'tab on'])
    const made = pointer(ctx, $('cur2'), $('mk'), t, 4.6, 5.3, {
      from: [-200, 180],
    })
    rise($('rep'), made ? eo(seg(t, 5.4, 5.9)) : 0, 30)
    // Draft, then Under Review, then Filed: each badge lights as the report reaches it
    const lit = ['badge b-warn', 'badge b-v']
    steps($('st0'), t, [6.6], null, lit)
    steps($('st1'), t, [6.6, 7.8], null, [
      'badge b-mute',
      'badge b-warn',
      'badge b-v',
    ])
    steps($('st2'), t, [7.8], null, ['badge b-mute', 'badge b-good'])
    // Open the filed report: the statements page gives way to the report's own page
    const opened = pointer(ctx, $('cur'), $('rep'), t, 8.4, 9.0, {
      from: [180, -120],
    })
    const cut = eo(seg(t, 9.1, 9.6))
    // The slow camera push of the other spotlights, easing out at the cut so the
    // report page sits square
    const zoom = 0.04 * eio(seg(t, 0.4, 8.6)) * (1 - cut)
    $('main').style.transformOrigin = '480px 330px'
    $('main').style.transform = `scale(${1 + zoom})`
    $('pa').style.opacity = String(1 - cut)
    $('pb').style.opacity = String(opened ? cut : 0)
    ctx.nav('reports', 'statements', seg(t, 9.1, 9.6))
    if (t < 9.1) ctx.nav('statements')
    // The actions menu, then the DataBook
    const menu = pointer(ctx, $('cur2'), $('dots'), t, 10.0, 10.6, {
      from: [-220, 160],
    })
    rise($('menu'), menu ? eo(seg(t, 10.7, 11.0)) : 0, -10)
    const picked = pointer(ctx, $('cur'), $('f3'), t, 11.4, 12.1, {
      from: [-120, -140],
    })
    $('f3').className = picked ? 'mi on' : 'mi'
    if (picked) $('menu').style.opacity = String(1 - seg(t, 12.4, 12.7))
    rise($('toast'), eo(seg(t, 12.5, 12.9)), 20)
  }
}

// Phone layout: larger type in a narrower stage.
const phoneCss = `
.tabs { flex-wrap: wrap; gap: 8px; } .tab { font-size: 14px; padding: 8px 12px; }
.tabs .tab:nth-child(3) { display: none; }
.btn { font-size: 15px; padding: 8px 14px; }
.tblwrap { height: 400px; }
.rep { left: 22px; right: 22px; bottom: 18px; flex-wrap: wrap; gap: 10px; padding: 14px 16px; }
.steps { margin-left: 0; } .rep b { font-size: 17px; }
.rl-main { padding: 0; } .pg { padding: 20px 22px; }
.rhead { position: static; justify-content: flex-end; margin: -4px 0 12px; }
.menu { top: 150px; right: 22px; width: 300px; }
.toast { left: 22px; bottom: 18px; font-size: 15px; }
`

export default {
  width: 1200,
  height: 750,
  total: TOTAL,
  poster: 11.2,
  css,
  html:
    appChrome({ active: 'statements', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"') +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur2"'),
  setup,
  mobile: { width: 720, height: 740, css: PHONE_APP_CSS + phoneCss },
}

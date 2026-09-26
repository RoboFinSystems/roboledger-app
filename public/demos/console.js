/*
 * Spotlight: Ask about your books in plain English. A question typed into the
 * AI Console, the generated query shown, and the answer as a table.
 * Driftline demo company: receivables of $153,333 at 2026-08-31, $128,000 of it
 * Summit Markets; the split across the three café accounts is illustrative.
 */
import { appChrome, eo, pageHeader, rise, seg, typed } from './kit.js'

const Q = 'Which customers owe us the most?'
const CY = [
  'MATCH (e:Event)-[:EVENT_INVOLVES_AGENT]->(a:Agent)',
  "WHERE a.agent_type = 'customer' AND e.event_type = 'invoice'",
  'RETURN a.name AS customer, sum(e.open_amount) AS owed',
  'ORDER BY owed DESC',
].join('\n')
const RES = [
  ['Summit Markets', '$128,000.00', 83.5],
  ['Pioneer Square Cafés', '$9,120.00', 5.9],
  ['Emerald City Grocers', '$8,440.00', 5.5],
  ['Cascadia Coffee Bars', '$7,773.33', 5.1],
]

const main = `${pageHeader('Console', 'Ask about your ledger in plain English')}
  <div class="card ask"><span class="pr">›</span><span id="q"></span><span class="caret" id="caret"></span><span class="btn go send" id="send">Ask</span></div>
  <div class="card code" id="code"><div class="ch">Generated query · Cypher</div><pre id="cy"></pre></div>
  <table id="res">
    <tr><th>Customer</th><th class="n">Owed</th><th>Share of receivables</th></tr>
    ${RES.map((r, i) => `<tr id="r${i}"><td>${r[0]}</td><td class="n">${r[1]}</td><td><span class="sh"><i id="s${i}"></i></span><em>${r[2]}%</em></td></tr>`).join('')}
  </table>`

const css = `
.ask { display: flex; align-items: center; gap: 12px; padding: 14px 18px; font-size: 21px; }
.pr { color: var(--v400); font-weight: 700; }
.caret { width: 2px; height: 26px; background: var(--v300); }
.send { margin-left: auto; }
.code { margin-top: 16px; padding: 14px 18px; opacity: 0; }
.ch { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
pre { font: 15px/1.55 var(--mono); color: var(--v300); white-space: pre-wrap; min-height: 94px; }
#res { margin-top: 16px; }
#res tr { opacity: 0; }
#res tr:first-child { opacity: 1; }
.sh { display: inline-block; width: 200px; height: 10px; border-radius: 5px; background: #2e2d35; margin-right: 12px; vertical-align: middle; overflow: hidden; }
.sh i { display: block; height: 100%; background: linear-gradient(90deg, var(--v500), var(--f400)); }
#res em { font-style: normal; font-family: var(--mono); font-size: 15px; color: var(--muted); }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('console')
  return (t) => {
    $('q').textContent = typed(Q, t, 0.3, 26)
    $('caret').style.opacity =
      t < 1.9 && Math.floor(t * 3) % 2 === 0 ? 1 : t < 1.9 ? 0.2 : 0
    $('send').style.transform = `scale(${t > 1.9 && t < 2.1 ? 0.94 : 1})`
    rise($('code'), eo(seg(t, 2.2, 2.6)), 12)
    $('cy').textContent = typed(CY, t, 2.5, 95)
    RES.forEach((r, i) => {
      const p = eo(seg(t, 4.4 + i * 0.18, 4.8 + i * 0.18))
      rise($('r' + i), p, 10)
      $('s' + i).style.width = r[2] * p + '%'
    })
    $('r0').cells[0].style.boxShadow =
      t > 5.8 ? 'inset 4px 0 0 var(--f400)' : ''
  }
}

export default {
  width: 1200,
  height: 750,
  total: 9.5,
  poster: 7,
  label:
    'The RoboLedger AI Console answering which customers owe the most, showing the generated query and the result.',
  css,
  html: appChrome({ active: 'console', main }),
  setup,
}

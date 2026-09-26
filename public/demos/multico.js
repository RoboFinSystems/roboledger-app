/*
 * Agent surface: one AI chat with a RoboLedger connector per company (one
 * sign-in reaches one company's books), reading all three and answering across
 * them. Figures are the three demo companies' compiled reports: Driftline and
 * Cadence Labs for FY ending 2026-08-31, Cascade Advisory for FY2025.
 */
import { eo, rise, seg, spin, tile, typed } from './kit.js'

const COS = [
  {
    id: 'Driftline Coffee Roasters',
    short: 'Driftline',
    rev: '$1.23M',
    gm: '58.6%',
    ni: '+$162K',
    cash: '$31K',
    flag: 'cash',
  },
  {
    id: 'Cadence Labs, Inc.',
    short: 'Cadence Labs',
    rev: '$1.25M',
    gm: '78.6%',
    ni: '−$1.07M',
    cash: '$1.91M',
    flag: 'ni',
  },
  {
    id: 'Cascade Advisory Group',
    short: 'Cascade Advisory',
    rev: '$100.5K',
    gm: '100%',
    ni: '+$7.4K',
    cash: '$51K',
    flag: '',
  },
]
const Q = 'Which of my clients needs attention this month?'
const A = [
  ['', 'Two of three. '],
  [
    'Cadence Labs',
    ' is losing about $89K a month, with 21 months of cash at that rate. ',
  ],
  [
    'Driftline',
    ' is profitable, but cash is down to $31K with receivables up. ',
  ],
  ['Cascade', ' is steady.'],
]

const html = `
<div class="chat" id="chat">
  <div class="hd"><div class="t">Your AI chat · 3 companies connected over MCP</div>
    ${COS.map((c) => `<span class="chip"><span class="dot"></span>RoboLedger · ${c.short}</span>`).join('')}</div>
  <div class="body">
    <div class="ub" id="q"></div>
    ${COS.map((c, i) => `<div class="tool" id="tl${i}"><div class="tn"><span>${c.short.toLowerCase().split(' ')[0]} · live-financial-statement</span><span class="st" id="ts${i}"></span></div></div>`).join('')}
    <div class="ans" id="ans"></div>
  </div>
</div>
<div class="card snap" id="snap">
  <div class="sh">${tile(34, 9)}<b>Client snapshot</b><span>latest fiscal year, from each company's own books</span></div>
  <table>
    <tr><th>Company</th><th class="n">Revenue</th><th class="n">Gross margin</th><th class="n">Net income</th><th class="n">Cash</th></tr>
    ${COS.map((c, i) => `<tr id="r${i}"><td>${c.id}</td><td class="n">${c.rev}</td><td class="n">${c.gm}</td><td class="n" id="ni${i}">${c.ni}</td><td class="n" id="ca${i}">${c.cash}</td></tr>`).join('')}
  </table>
</div>`

const css = `
.stage { background: transparent; }
.chat { position: absolute; left: 30px; top: 20px; width: 760px; height: 720px; background: #0f0e14; border: 1px solid var(--line); border-radius: 24px; overflow: hidden; }
.hd { padding: 20px 26px; border-bottom: 1px solid var(--line); }
.hd .t { font-size: 19px; color: var(--muted); margin-bottom: 12px; }
.chip { display: inline-flex; align-items: center; gap: 8px; padding: 6px 13px; border-radius: 999px; border: 1px solid var(--line); background: var(--card2); font-size: 16px; margin: 0 8px 6px 0; }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--good); }
.body { padding: 24px 26px; display: flex; flex-direction: column; gap: 14px; }
.ub { font-size: 23px; max-width: 560px; min-height: 58px; }
.tool { padding: 11px 16px; opacity: 0; }
.tool .tn { font-size: 16px; }
.ans { font-size: 23px; line-height: 1.45; margin-top: 6px; }
.snap { position: absolute; right: 30px; top: 190px; width: 760px; padding: 22px 24px; opacity: 0; }
.sh { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.sh b { font-size: 22px; } .sh span:not(.tile) { color: var(--muted); font-size: 15px; margin-left: auto; }
.snap td { font-size: 17px; }
td.warn { color: var(--bad); box-shadow: inset 0 0 0 2px rgba(248,113,113,.6); }
`

function setup(ctx) {
  const { $ } = ctx
  return (t) => {
    rise($('chat'), eo(seg(t, 0, 0.5)), 30)
    $('q').textContent = typed(Q, t, 0.4, 40)
    COS.forEach((c, i) => {
      const t0 = 1.9 + i * 0.35
      rise($('tl' + i), eo(seg(t, t0, t0 + 0.25)), 10)
      $('ts' + i).innerHTML =
        t > t0 + 0.9
          ? '<span style="color:var(--good)">✓ done</span>'
          : `<span style="color:var(--muted)">${spin(t)} running</span>`
      rise($('r' + i), eo(seg(t, t0 + 0.9, t0 + 1.3)), 10)
    })
    rise($('snap'), eo(seg(t, 2.6, 3.1)), 30)
    let left = Math.max(0, Math.floor((t - 3.9) * 55))
    $('ans').innerHTML = A.map(([bold, rest]) => {
      const b = bold.slice(0, Math.max(0, left))
      left -= bold.length
      const r = rest.slice(0, Math.max(0, left))
      left -= rest.length
      return (b ? `<b>${b}</b>` : '') + r
    }).join('')
    COS.forEach((c, i) => {
      $('ni' + i).className = 'n' + (c.flag === 'ni' && t > 4.6 ? ' warn' : '')
      $('ca' + i).className =
        'n' + (c.flag === 'cash' && t > 5.6 ? ' warn' : '')
    })
  }
}

export default {
  width: 1600,
  height: 760,
  total: 10,
  poster: 8.5,
  css,
  html,
  setup,
}

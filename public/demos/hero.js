/*
 * Hero pitch: who you are, the problem, the turn, then five beats of asking
 * the AI while RoboLedger changes beside it. Figures are the Driftline demo
 * company at FY end 2026-08-31, and public-peer medians from the latest 10-Ks
 * of three coffee filers on the SEC graph. The September to November cash plan
 * is illustrative.
 */
import {
  appChrome,
  clamp01,
  CURSOR,
  eio,
  eo,
  pageHeader,
  pointer,
  rise,
  seg,
  spin,
  tile,
  typed,
} from './kit.js'

const BEATS = [
  {
    k: 'statements',
    q: "We're profitable. Why is cash down?",
    tool: 'financial-statement-analysis',
    res: 'Balance sheet · FY2026 vs FY2025',
    a: [
      'Receivables grew from $17K to ',
      '$153K',
      '. Summit Markets owes $128K of it. The profit is sitting in one slow-paying account.',
    ],
  },
  {
    k: 'reports',
    q: 'Send the board this balance sheet.',
    tool: 'create-report',
    res: 'FY2026 Board Pack · shared to Board',
    a: [
      'Done. The board has a balance sheet that ',
      'ties to the ledger',
      ', with the receivables note attached.',
    ],
  },
  {
    k: 'plan',
    q: 'Plan next quarter with Summit on 30-day terms.',
    tool: 'compute-forecast',
    res: 'Sep to Nov 2026 · 1 assumption changed',
    a: [
      'Cash recovers to ',
      '$117K by November',
      ' if Summit pays in 30 days. Nothing else in the plan moves.',
    ],
  },
  {
    k: 'explorer',
    q: 'How do we compare to public peers?',
    tool: 'build-fact-grid',
    res: 'Driftline + 3 public coffee filers',
    sec: true,
    a: [
      "Your margin is far above the peer median. Your collections aren't: ",
      '46 days vs 29',
      '.',
    ],
  },
  {
    k: 'close',
    q: 'Draft the August close.',
    tool: 'get-period-close-status',
    res: 'August 2026 · 3 schedules due',
    a: [
      '3 entries drafted, ',
      '12 of 12 checks pass',
      '. Post them and close August?',
    ],
    approve: true,
  },
]

const SCHED = [
  ['Roasting & Packaging Line Depreciation', '$1,071.43'],
  ['Automated Packaging Line Depreciation', '$400.00'],
  ['Business Insurance Amortization', '$1,000.00'],
]

const ACT = [95.2, 88.0, 60.6, 73.1, 60.4, 31.2] // cash $K, Mar..Aug 2026 (ledger)
const PLAN = [31.2, 58, 92, 117] // Aug..Nov, Summit on 30-day terms
const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const CH = { w: 740, h: 470, l: 70, r: 24, t: 20, b: 50 }
const xAt = (i) => CH.l + (i * (CH.w - CH.l - CH.r)) / 8
const yAt = (v) => CH.t + (1 - v / 130) * (CH.h - CH.t - CH.b)

function chartSvg() {
  let s = ''
  ;[0, 40, 80, 120].forEach((v) => {
    s += `<line x1="${CH.l}" x2="${CH.w - CH.r}" y1="${yAt(v)}" y2="${yAt(v)}" stroke="#2a2833"/><text x="${CH.l - 12}" y="${yAt(v) + 6}" fill="#6b6780" font-size="16" text-anchor="end" font-family="Menlo, monospace">$${v}K</text>`
  })
  MONTHS.forEach((m, i) => {
    s += `<text x="${xAt(i)}" y="${CH.h - 16}" fill="#6b6780" font-size="16" text-anchor="middle">${m}</text>`
  })
  const pa = ACT.map((v, i) => `${i ? 'L' : 'M'}${xAt(i)},${yAt(v)}`).join(' ')
  const pp = PLAN.map((v, i) => `${i ? 'L' : 'M'}${xAt(i + 5)},${yAt(v)}`).join(
    ' '
  )
  s += `<path d="${pa}" fill="none" stroke="#A78BFA" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
  s += `<path d="${pp}" fill="none" stroke="#E879F9" stroke-width="5" stroke-dasharray="14 10" stroke-linecap="round"/>`
  s += `<rect id="ppmask" x="${xAt(5)}" y="0" width="${xAt(8) - xAt(5) + 24}" height="${CH.h}" fill="#141319"/>`
  s += `<circle id="pdot" cx="${xAt(8)}" cy="${yAt(117)}" r="9" fill="#E879F9"/><text id="plbl" x="${xAt(8) - 14}" y="${yAt(117) - 22}" fill="#f4f2fb" font-size="22" font-weight="700" text-anchor="end" font-family="Menlo, monospace">$117K</text>`
  return `<svg width="${CH.w}" height="${CH.h}" viewBox="0 0 ${CH.w} ${CH.h}">${s}</svg>`
}

const chatGroups = BEATS.map(
  (b, i) => `
  <div class="grp" id="g${i}">
    <div class="ub" id="q${i}"></div>
    <div class="tool" id="tl${i}"><div class="tn"><span>${b.sec ? 'sec · ' : ''}${b.tool}</span><span class="st" id="ts${i}"></span></div><div class="tr" id="tr${i}"></div></div>
    <div class="ans" id="an${i}"></div>
    ${
      b.approve
        ? `<div class="approve" id="ap"><span class="btn go lg" id="apgo">Approve and close</span><span class="btn ghost lg">Review first</span></div>
    <div class="tool" id="tl5"><div class="tn"><span>close-period 2026-08</span><span class="st" id="ts5"></span></div><div class="tr" id="tr5"></div></div>`
        : ''
    }
  </div>`
).join('')

const views = `
  <div class="view" id="v1">${pageHeader('Live Statements', 'Render BS / IS / CF from the current ledger, no close required')}
    <div class="tabs"><span class="tab on">Balance Sheet</span><span class="tab">Income Statement</span><span class="tab">Cash Flow</span></div>
    <table>
      <tr><th>Concept</th><th class="n">Aug 31, 2026</th><th class="n">Aug 31, 2025</th></tr>
      <tr><td>Cash and Cash Equivalents</td><td class="n" id="cashc">$31,166.49</td><td class="n">$71,944.40</td></tr>
      <tr id="arrow"><td>Receivables, Net, Current</td><td class="n">$153,333.33</td><td class="n">$17,333.33</td></tr>
      <tr><td>Inventory, Net</td><td class="n">$96,000.00</td><td class="n">$22,000.00</td></tr>
      <tr><td>Prepaid Expense, Current</td><td class="n">$11,000.00</td><td class="n">$15,500.00</td></tr>
      <tr class="tot"><td>Assets, Current</td><td class="n">$291,499.82</td><td class="n">$126,777.73</td></tr>
      <tr><td>Property, Plant and Equipment, Net</td><td class="n">$67,000.12</td><td class="n">$56,785.74</td></tr>
      <tr class="tot"><td>Assets</td><td class="n">$358,499.94</td><td class="n">$183,563.47</td></tr>
    </table><div class="hl" id="hl1"></div>
  </div>
  <div class="view" id="v2">${pageHeader('Reports', 'Validated statements, shared with the people who ask')}
    <div class="rcard card" id="rnew"><div><b>FY2026 Board Pack · Balance Sheet</b><span id="rsub">Generated from the ledger · ties to trial balance</span></div><span class="badge" id="rbadge">Draft</span></div>
    <div class="rcard card"><div><b>Q3 FY2026 Board Pack</b><span>Shared · Board · 3 recipients</span></div><span class="badge b-good">Shared</span></div>
    <div class="rcard card"><div><b>FY2025 Annual Statements</b><span>Shared · Lender · 1 recipient</span></div><span class="badge b-good">Shared</span></div>
  </div>
  <div class="view" id="v3">${pageHeader('Plan', 'Operating plan rolled forward from actuals')}
    <div class="card" style="padding:20px 24px">
      <div style="display:flex;gap:28px;font-size:17px;color:var(--muted);margin-bottom:10px">
        <span><b style="color:var(--v400)">━</b> Cash, actual</span><span><b style="color:var(--f400)">┅</b> Plan: Summit on 30-day terms</span></div>
      ${chartSvg()}
    </div>
  </div>
  <div class="view" id="v4">${pageHeader('Explorer', 'Your books beside public filers, one taxonomy')}
    <table id="cmp">
      <tr><th>Metric</th><th class="n">Driftline</th><th class="n">Public peers, median</th></tr>
      <tr><td>Gross margin</td><td class="n" style="color:var(--good)">58.6%</td><td class="n">16.0%</td></tr>
      <tr id="dso"><td>Days sales outstanding</td><td class="n" style="color:var(--bad)">46 days</td><td class="n">29 days</td></tr>
      <tr><td>Inventory days</td><td class="n" style="color:var(--good)">69 days</td><td class="n">92 days</td></tr>
    </table><div class="hl" id="hl4"></div>
    <div style="margin-top:16px;font-size:16px;color:var(--dim)">Peers: three public coffee companies · latest 10-K each, from the SEC graph</div>
  </div>
  <div class="view" id="v5">${pageHeader('Closing Book', 'Financial statements, schedules, and period close')}
    <div class="strip card">
      <span><label>Closed through</label><div id="cthru">July 2026</div></span>
      <span><label>Close target</label><div id="ctgt">August 2026</div></span>
      <span><label>Checks</label><div id="chk">-</div></span>
    </div>
    <table><tr><th>Schedule</th><th class="n">Amount</th><th>Status</th></tr>
      ${SCHED.map((s, i) => `<tr><td>${s[0]}</td><td class="n">${s[1]}</td><td><span class="badge" id="sb${i}"></span></td></tr>`).join('')}
    </table>
  </div>`

const html = `
<div class="bg"></div><div class="gridbg"></div>

<div class="scene" id="s1"><div class="center">
  <div class="eyebrow">CFO · Fractional CFO · Controller</div>
  <div class="big" style="margin-top:34px">You own the <span class="grad" id="w4">numbers.</span></div>
</div></div>

<div class="scene" id="s2a">
  <div class="msg" id="bm" style="left:510px;top:220px">
    <div class="who"><div class="av" style="background:#334155">JR</div><div><b>Board chair</b> <span>· 9:14 PM</span></div></div>
    <p>Great year on paper. So why is cash down?</p>
  </div>
  <div class="msg" id="rm" style="left:510px;top:520px;background:#1b1729;border-color:#3b3158">
    <div class="who"><div class="av" style="background:var(--v600)">You</div><div><b>You</b></div></div>
    <p id="rmt"></p>
  </div>
  <div class="caption" id="c2a">The board has a question. <em>You need a day to answer it.</em></div>
</div>

<div class="scene" id="s2b">
  <div class="file" id="f1" style="left:320px;top:250px"><div class="xl">X</div>trial_balance_export.xlsx</div>
  <div class="file" id="f2" style="left:360px;top:410px"><div class="xl">X</div>coa_mapping_v7.xlsx</div>
  <div class="file" id="f3" style="left:400px;top:570px"><div class="xl">X</div>board_pack_FINAL_v3.xlsx</div>
  <div id="sheet"></div>
  <div class="caption" id="c2b">The answer is three exports and a spreadsheet away.</div>
</div>

<div class="scene" id="s2c">
  <div class="gchat" id="gc">
    <div class="ub" style="max-width:640px;margin-left:auto"><div class="attach">📎 trial_balance.csv</div><div id="gq"></div></div>
    <div class="ans" id="ga" style="color:#cfcbdc;margin-top:26px"></div>
  </div>
  <div class="caption" id="c2c">And the AI you already pay for <em>can't see your books.</em></div>
</div>

<div class="scene" id="s3"><div class="center">
  <div class="big" style="font-size:100px"><span id="t1" style="display:inline-block">Connect your books.</span><br><span class="grad" id="t2" style="display:inline-block">Ask your AI.</span></div>
  <div style="display:flex;align-items:center;margin-top:70px">
    <div class="node" id="n1">QuickBooks</div><div class="wire" id="wr1"></div>
    <div class="node" id="n2" style="border-color:var(--v500)">${tile(48, 12)}RoboLedger</div><div class="wire" id="wr2"></div>
    <div class="node" id="n3">Claude · ChatGPT · any MCP client</div>
  </div>
</div></div>

<div class="scene" id="s4">
  <div id="cap">
    <span id="k1"><i>01</i>Ask why.</span>
    <span id="k2"><i>02</i>Share it.</span>
    <span id="k3"><i>03</i>Plan from it.</span>
    <span id="k4"><i>04</i>Compare it.</span>
    <span id="k5"><i>05</i>Close it. <em class="grad">You approve.</em></span>
  </div>
  <div id="chat">
    <div class="hd"><div class="t">Your AI chat · connected over MCP</div>
      <span class="chip"><span class="dot"></span>RoboLedger · Driftline</span><span class="chip"><span class="dot"></span>SEC filings</span></div>
    <div id="chatbody">${chatGroups}</div>
  </div>
  <div id="app">${appChrome({ active: 'statements', main: views })}</div>
  ${CURSOR.replace('class="cursor"', 'class="cursor" id="cursor"')}
</div>

<div class="scene" id="s5"><div class="center">
  <span id="cl">${tile(110, 26)}</span>
  <div class="big grad" id="cu" style="font-size:112px;margin-top:34px">roboledger.ai</div>
  <div id="cn" style="font-size:40px;font-weight:600;margin-top:30px">Nothing writes back until you post an entry.</div>
  <div id="cw" style="font-size:28px;color:var(--muted);margin-top:26px">Works with Claude, ChatGPT, or any MCP client</div>
  <div id="cd" style="position:absolute;bottom:40px;font-size:18px;color:var(--dim)">Driftline Coffee Roasters is a demo company.</div>
</div></div>
<div id="blackout"></div>`

const css = `
.stage { background: var(--bg); }
.bg { position: absolute; inset: 0;
  background: radial-gradient(900px 700px at 12% 8%, rgba(124,58,237,.30), transparent 70%),
              radial-gradient(900px 700px at 92% 96%, rgba(217,70,239,.16), transparent 70%); }
.gridbg { position: absolute; inset: 0; opacity: .07;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 64px 64px; -webkit-mask-image: radial-gradient(900px 600px at 50% 50%, #000, transparent); }
.scene { position: absolute; inset: 0; opacity: 0; display: none; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.eyebrow { font: 600 24px var(--display); letter-spacing: .32em; color: var(--v300); text-transform: uppercase; }
.big { font: 800 118px/1.04 var(--display); letter-spacing: -.01em; }
.caption { position: absolute; left: 0; right: 0; bottom: 96px; text-align: center; font-size: 46px; font-weight: 600; }
.caption em { font-style: normal; color: var(--f400); }
.msg { position: absolute; width: 900px; background: var(--card); border: 1px solid var(--line); border-radius: 22px; padding: 30px 36px; box-shadow: 0 30px 80px rgba(0,0,0,.5); }
.who { display: flex; align-items: center; gap: 18px; margin-bottom: 16px; }
.av { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 22px; }
.who b { font-size: 26px; } .who span { color: var(--muted); font-size: 22px; }
.msg p { font-size: 36px; line-height: 1.35; min-height: 48px; }
.file { position: absolute; width: 520px; height: 120px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; display: flex; align-items: center; gap: 22px; padding: 0 28px; font: 26px var(--mono); box-shadow: 0 20px 60px rgba(0,0,0,.5); }
.xl { flex-shrink: 0; width: 58px; height: 58px; border-radius: 12px; background: #1d6f42; display: grid; place-items: center; font: 700 26px var(--body); color: #fff; }
#sheet { position: absolute; left: 1060px; top: 230px; display: grid; grid-template-columns: repeat(6, 120px); gap: 4px; }
#sheet div { height: 54px; background: #15151b; border: 1px solid #22222a; font: 500 19px var(--mono); color: #7d7a8c; display: grid; place-items: center; }
#sheet div.ref { color: var(--bad); background: rgba(248,113,113,.12); border-color: rgba(248,113,113,.5); font-weight: 700; }
.gchat { position: absolute; left: 460px; top: 230px; width: 1000px; height: 440px; background: #111016; border: 1px solid var(--line); border-radius: 24px; padding: 40px; }
.attach { display: inline-flex; gap: 12px; padding: 12px 18px; margin-bottom: 12px; border: 1px solid var(--line); border-radius: 14px; font: 22px var(--mono); color: var(--muted); }
.node { padding: 22px 34px; border-radius: 18px; border: 1px solid var(--line); background: var(--card); font-size: 30px; font-weight: 600; display: flex; align-items: center; gap: 16px; }
.wire { width: 150px; height: 3px; background: linear-gradient(90deg, var(--v500), var(--f500)); transform-origin: left; }

#cap { position: absolute; left: 0; right: 0; top: 46px; height: 60px; text-align: center; font: 700 44px var(--display); }
#cap > span { position: absolute; left: 0; right: 0; opacity: 0; }
#cap i { font-style: normal; font-size: 22px; color: var(--muted); letter-spacing: .3em; margin-right: 22px; vertical-align: middle; }
#cap em { font-style: normal; }
#chat { position: absolute; left: 70px; top: 150px; width: 700px; height: 870px; background: #0f0e14; border: 1px solid var(--line); border-radius: 26px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.55); }
#chat .hd { height: 120px; border-bottom: 1px solid var(--line); padding: 22px 30px; }
#chat .hd .t { font-size: 22px; color: var(--muted); margin-bottom: 14px; }
.chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--line); background: var(--card2); font-size: 19px; margin-right: 10px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--good); }
#chatbody { position: absolute; left: 0; right: 0; top: 120px; bottom: 0; }
.grp { position: absolute; left: 30px; right: 30px; top: 34px; display: none; flex-direction: column; gap: 22px; }
.approve { display: flex; gap: 14px; }
.btn.lg { padding: 14px 28px; font-size: 23px; border-radius: 12px; }
#app { position: absolute; left: 810px; top: 150px; width: 1040px; height: 870px; border: 1px solid var(--line); border-radius: 26px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.55); }
.view { position: absolute; inset: 0; padding: 26px 30px; opacity: 0; }
.rcard { padding: 20px 24px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.rcard b { font-size: 21px; } .rcard span:not(.badge) { display: block; color: var(--muted); font-size: 16px; margin-top: 6px; }
.strip { display: flex; gap: 44px; padding: 18px 24px; margin-bottom: 18px; }
.strip label { display: block; font-size: 13px; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
.strip div { font-size: 22px; font-weight: 700; }
#blackout { position: absolute; inset: 0; background: #000; opacity: 0; z-index: 50; }
`

const S1 = [0, 3.6],
  S2A = [3.6, 8.0],
  S2B = [8.0, 11.6],
  S2C = [11.6, 15.4],
  S3 = [15.4, 18.8]
const B = [18.8, 23.2, 27.6, 32.0, 36.4]
const S4 = [18.8, 41.6],
  S5 = [41.6, 46.2]
const TOTAL = 46.2
const REF = new Set([3, 8, 14, 21, 26, 33])

function win(el, t, [a, b], fi = 0.45, fo = 0.4, first = false) {
  const v =
    t >= a && t < b
      ? (first ? 1 : eo(seg(t, a, a + fi))) * (1 - eio(seg(t, b - fo, b)))
      : 0
  el.style.opacity = v
  el.style.display = v > 0 ? 'block' : 'none'
  return t - a
}

function answer(parts, n) {
  let out = '',
    left = n
  parts.forEach((p, i) => {
    const s = p.slice(0, Math.max(0, left))
    left -= p.length
    out += i === 1 ? `<b>${s}</b>` : s
  })
  return out
}

function setup(ctx) {
  const { $, root } = ctx
  const sheet = $('sheet')
  for (let i = 0; i < 36; i++) {
    const d = document.createElement('div')
    d.textContent =
      i % 5 === 0 ? '' : (Math.abs(Math.sin(i * 7.3)) * 90000).toFixed(0)
    if (REF.has(i)) d.dataset.ref = '1'
    sheet.appendChild(d)
  }
  const cells = [...sheet.children]
  const cmpRows = [...root.getElementById('cmp').rows]

  return (t) => {
    t = Math.max(0, Math.min(TOTAL, t))

    let lt = win($('s1'), t, S1, 0.45, 0.4, true)
    $('w4').style.transform =
      `scale(${1 + 0.04 * Math.sin(clamp01(lt / 3.2) * Math.PI)})`
    $('w4').style.display = 'inline-block'

    lt = win($('s2a'), t, S2A)
    rise($('bm'), eo(seg(lt, 0.2, 0.8)))
    rise($('rm'), eo(seg(lt, 1.5, 1.9)))
    $('rmt').textContent = typed('Let me get back to you.', lt, 1.9, 22)
    rise($('c2a'), eo(seg(lt, 2.6, 3.1)), 20)

    lt = win($('s2b'), t, S2B)
    ;['f1', 'f2', 'f3'].forEach((f, i) => {
      const p = eo(seg(lt, 0.1 + i * 0.35, 0.6 + i * 0.35))
      $(f).style.opacity = p
      $(f).style.transform =
        `translateX(${(1 - p) * -80}px) rotate(${(i - 1) * -2 * p}deg)`
    })
    cells.forEach((d, i) => {
      const o = (i % 6) * 0.05 + Math.floor(i / 6) * 0.06
      d.style.opacity = eo(seg(lt, 0.3 + o, 0.7 + o))
      if (d.dataset.ref) {
        const on = lt > 1.4 + (i % 4) * 0.18
        d.className = on ? 'ref' : ''
        d.textContent = on ? '#REF!' : '0.00'
      }
    })
    rise($('c2b'), eo(seg(lt, 1.6, 2.1)), 20)

    lt = win($('s2c'), t, S2C)
    rise($('gc'), eo(seg(lt, 0, 0.5)), 30)
    $('gq').textContent = typed('Why is cash down this year?', lt, 0.5, 36)
    $('ga').textContent = typed(
      "I can only see this one export. I don't have your receivables, your customers, or last year to compare against.",
      lt,
      1.2,
      85
    )
    rise($('c2c'), eo(seg(lt, 2.5, 3.0)), 20)

    lt = win($('s3'), t, S3)
    rise($('t1'), eo(seg(lt, 0.1, 0.6)))
    rise($('t2'), eo(seg(lt, 0.6, 1.1)))
    rise($('n1'), eo(seg(lt, 1.2, 1.6)), 20)
    $('wr1').style.transform = `scaleX(${eo(seg(lt, 1.5, 1.9))})`
    rise($('n2'), eo(seg(lt, 1.8, 2.2)), 20)
    $('wr2').style.transform = `scaleX(${eo(seg(lt, 2.1, 2.5))})`
    rise($('n3'), eo(seg(lt, 2.4, 2.8)), 20)

    lt = win($('s4'), t, S4, 0.5, 0.45)
    if (t >= S4[0] && t < S4[1]) {
      rise($('chat'), eo(seg(lt, 0, 0.7)), 60)
      rise($('app'), eo(seg(lt, 0.15, 0.85)), 60)

      let bi = 0
      for (let i = 0; i < B.length; i++) if (t >= B[i]) bi = i
      const bt = t - B[bi]

      for (let i = 0; i < 5; i++) {
        const c = $('k' + (i + 1))
        if (i === bi) rise(c, eo(seg(bt, 0.05, 0.45)), 16)
        else if (i === bi - 1) {
          const q = seg(bt, 0, 0.3)
          c.style.opacity = 1 - q
          c.style.transform = `translateY(${-16 * q}px)`
        } else c.style.opacity = 0
      }

      BEATS.forEach((b, i) => {
        const g = $('g' + i)
        if (i === bi) {
          g.style.display = 'flex'
          rise(g, eo(seg(bt, 0.15, 0.5)), 30)
          $('q' + i).textContent = typed(b.q, bt, 0.2, 48)
          rise($('tl' + i), eo(seg(bt, 1.0, 1.25)), 12)
          const done = bt > 1.75
          $('ts' + i).innerHTML = done
            ? '<span style="color:var(--good)">✓ done</span>'
            : `<span style="color:var(--muted)">${spin(bt)} running</span>`
          $('tr' + i).textContent = done ? b.res : ''
          $('an' + i).innerHTML = answer(b.a, Math.floor((bt - 1.85) * 70))
          if (b.approve) {
            rise($('ap'), eo(seg(bt, 2.9, 3.2)), 10)
            const pressed = pointer(ctx, $('cursor'), $('apgo'), bt, 3.0, 3.5)
            $('apgo').textContent = pressed ? 'Approved ✓' : 'Approve and close'
            rise($('tl5'), eo(seg(bt, 3.75, 4.0)), 12)
            const cd = bt > 4.15
            $('ts5').innerHTML = cd
              ? '<span style="color:var(--good)">✓ done</span>'
              : `<span style="color:var(--muted)">${spin(bt)} running</span>`
            $('tr5').textContent = cd
              ? 'Posted 3 entries · closed through August 2026'
              : ''
          }
        } else if (i === bi - 1 && bt < 0.35) {
          g.style.display = 'flex'
          const q = seg(bt, 0, 0.3)
          g.style.opacity = 1 - q
          g.style.transform = `translateY(${-50 * q}px)`
        } else g.style.display = 'none'
      })
      if (bi !== 4) $('cursor').style.opacity = 0

      // the app view switches when the tool fires
      const vi = bt >= 1.0 || bi === 0 ? bi : bi - 1
      const vt =
        bt >= 1.0 ? bt - 1.0 : bi === 0 ? 0 : bt + (B[bi] - B[bi - 1]) - 1.0
      for (let i = 0; i < 5; i++) {
        const v = $('v' + (i + 1))
        const p =
          i === vi ? (bi === 0 && bt < 1.0 ? 1 : eo(seg(vt, 0, 0.35))) : 0
        v.style.opacity = p
        v.style.transform = `translateX(${(1 - p) * 30}px)`
      }
      ctx.nav(
        BEATS[vi].k,
        vi > 0 ? BEATS[vi - 1].k : BEATS[vi].k,
        seg(vt, 0, 0.35)
      )

      ctx.ring($('hl1'), $('arrow'), vi === 0 ? eo(seg(vt, 0.85, 1.2)) : 0)
      $('cashc').style.color = vi === 0 && vt > 0.85 ? 'var(--bad)' : ''
      if (vi === 1) {
        const s = vt > 0.75
        rise($('rnew'), eo(seg(vt, 0.05, 0.4)), 20)
        $('rbadge').textContent = s ? 'Shared' : 'Draft'
        $('rbadge').className = 'badge ' + (s ? 'b-good' : 'b-warn')
        $('rsub').textContent = s
          ? 'Shared · Board · 3 recipients'
          : 'Generated from the ledger · ties to trial balance'
        $('rnew').style.borderColor = s ? 'var(--f400)' : ''
      }
      if (vi === 2) {
        const d = eio(seg(vt, 0.2, 1.4))
        const x0 = xAt(5),
          x1 = xAt(8) + 24
        $('ppmask').setAttribute('x', x0 + (x1 - x0) * d)
        $('pdot').style.opacity = $('plbl').style.opacity = seg(vt, 1.3, 1.6)
      }
      if (vi === 3) {
        cmpRows.forEach((r, i) => {
          if (i) rise(r, eo(seg(vt, 0.05 + i * 0.12, 0.4 + i * 0.12)), 10)
        })
        ctx.ring($('hl4'), $('dso'), eo(seg(vt, 0.9, 1.2)))
      } else $('hl4').style.opacity = 0
      if (vi === 4) {
        const posted = bi === 4 && bt > 4.15
        SCHED.forEach((_, i) => {
          const drafted = vt > 0.3 + i * 0.15
          const b = $('sb' + i)
          b.textContent = posted ? 'posted' : drafted ? 'drafted' : 'pending'
          b.className =
            'badge ' + (posted ? 'b-good' : drafted ? 'b-v' : 'b-mute')
        })
        $('chk').textContent = vt > 0.9 ? '12 / 12 pass' : '-'
        $('chk').style.color = vt > 0.9 ? 'var(--good)' : ''
        $('cthru').textContent = posted ? '🔒 August 2026' : '🔒 July 2026'
        $('cthru').style.color = posted ? 'var(--f400)' : ''
        $('ctgt').textContent = posted ? 'September 2026' : 'August 2026'
      }
    }

    lt = win($('s5'), t, S5, 0.5, 0.01)
    rise($('cl'), eo(seg(lt, 0.1, 0.5)), 20)
    rise($('cu'), eo(seg(lt, 0.3, 0.8)), 30)
    rise($('cn'), eo(seg(lt, 0.9, 1.3)), 20)
    rise($('cw'), eo(seg(lt, 1.3, 1.7)), 20)
    $('cd').style.opacity = seg(lt, 1.6, 2.0)
    $('cl').style.display = 'inline-block'

    const fs = TOTAL - 0.6
    $('blackout').style.opacity = t > fs ? eio((t - fs) / 0.6) : 0
  }
}

export default {
  width: 1920,
  height: 1080,
  total: TOTAL,
  poster: 22.6,
  label:
    "An AI chat answering a finance lead's questions while RoboLedger shows the statements, the shared report, the plan, the peer comparison and the approved close.",
  css,
  html,
  setup,
}

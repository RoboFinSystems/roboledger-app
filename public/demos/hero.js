/*
 * Hero pitch: who you are, the problem, the turn, then five beats of asking
 * the AI while RoboLedger changes beside it. Figures are the Driftline demo
 * company at FY end 2026-08-31, and public-peer medians from the latest 10-Ks
 * of three coffee filers on the SEC graph. The September to November cash plan
 * is illustrative.
 */
import {
  appChrome,
  blurIn,
  clamp01,
  CURSOR,
  dip,
  eio,
  eo,
  pageHeader,
  PHONE_APP_CSS,
  pointer,
  rise,
  seg,
  spin,
  steps,
  swap,
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

// The step label sits at the head of each exchange, where the eye already is.
const STEP = [
  '<i>01</i>Ask why.',
  '<i>02</i>Share it.',
  '<i>03</i>Plan from it.',
  '<i>04</i>Compare it.',
  '<i>05</i>Close it. <em class="grad">You approve.</em>',
]

const chatGroups = BEATS.map(
  (b, i) => `
  <div class="grp" id="g${i}">
    <div class="step">${STEP[i]}</div>
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
  <div class="eyebrow" id="eb">CFO · Fractional CFO · Controller</div>
  <div class="big" style="margin-top:34px"><span class="wd" id="w1">You</span> <span class="wd" id="w2">own</span> <span class="wd" id="w3">the</span> <span class="wd grad" id="w4">numbers.</span></div>
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
  <div class="cal card" id="cal">
    <div class="calh"><b>September 2026</b><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
    <div class="calg" id="calg"></div>
  </div>
  <div class="caption" id="c2b">The real numbers show up after the close. <em>The meeting is Thursday.</em></div>
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
`

const css = `
.stage { background: var(--bg); }
.bg { position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(76,29,149,.22), rgba(88,28,135,.14) 50%, rgba(112,26,117,.16)); }
.gridbg { position: absolute; inset: 0; opacity: .07;
  background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px);
  background-size: 64px 64px; }
.scene { position: absolute; inset: 0; opacity: 0; display: none; }
.center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.eyebrow { font: 600 24px var(--display); letter-spacing: .32em; color: var(--v300); text-transform: uppercase; }
.big { font: 800 118px/1.04 var(--display); letter-spacing: -.01em; }
.caption { position: absolute; left: 0; right: 0; bottom: 96px; text-align: center; font-size: 46px; font-weight: 600; }
.caption em { font-style: normal; color: var(--f400); }
.msg { position: absolute; width: 900px; background: var(--card); border: 1px solid var(--line); border-radius: 22px; padding: 30px 36px; }
.who { display: flex; align-items: center; gap: 18px; margin-bottom: 16px; }
.av { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 22px; }
.who b { font-size: 26px; } .who span { color: var(--muted); font-size: 22px; }
.msg p { font-size: 36px; line-height: 1.35; min-height: 48px; }
.cal { position: absolute; left: 410px; top: 150px; width: 1100px; padding: 28px 26px 26px; border-radius: 24px; }
.calh { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 14px; color: var(--muted); font-size: 20px; }
.calh b { grid-column: 1 / -1; color: var(--ink); font: 700 30px var(--display); margin-bottom: 10px; }
.calg { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.day { position: relative; height: 118px; border-radius: 14px; background: #17161c; border: 1px solid #25242c; padding: 12px 14px; font: 600 24px var(--body); color: #cfcbdc; }
.day.out { color: #4a4757; }
.tag { position: absolute; left: 12px; right: 12px; bottom: 12px; padding: 7px 10px; border-radius: 9px; font-size: 17px; font-weight: 700; opacity: 0; }
.tag.meet { background: rgba(139,92,246,.25); color: var(--v300); }
.tag.miss { background: rgba(248,113,113,.18); color: var(--bad); }
.tag.close { background: rgba(251,191,36,.18); color: var(--warn); }
.gchat { position: absolute; left: 460px; top: 230px; width: 1000px; height: 440px; background: #111016; border: 1px solid var(--line); border-radius: 24px; padding: 40px; }
.attach { display: inline-flex; gap: 12px; padding: 12px 18px; margin-bottom: 12px; border: 1px solid var(--line); border-radius: 14px; font: 22px var(--mono); color: var(--muted); }
.node { padding: 22px 34px; border-radius: 18px; border: 1px solid var(--line); background: var(--card); font-size: 30px; font-weight: 600; display: flex; align-items: center; gap: 16px; }
.wire { width: 150px; height: 3px; background: linear-gradient(90deg, var(--v500), var(--f500)); transform-origin: left; }

.step { font: 700 34px var(--display); margin-bottom: 4px; }
.step i { font-style: normal; font-size: 18px; color: var(--muted); letter-spacing: .3em; margin-right: 16px; vertical-align: middle; }
.step em { font-style: normal; }
.wd { display: inline-block; }
#chat { position: absolute; left: 70px; top: 80px; width: 700px; height: 920px; background: #0f0e14; border: 1px solid var(--line); border-radius: 26px; overflow: hidden; }
#chat .hd { height: 120px; border-bottom: 1px solid var(--line); padding: 22px 30px; }
#chat .hd .t { font-size: 22px; color: var(--muted); margin-bottom: 14px; }
.chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--line); background: var(--card2); font-size: 19px; margin-right: 10px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: var(--good); }
#chatbody { position: absolute; left: 0; right: 0; top: 120px; bottom: 0; }
.grp { position: absolute; left: 30px; right: 30px; top: 34px; display: none; flex-direction: column; gap: 22px; }
.approve { display: flex; gap: 14px; }
.btn.lg { padding: 14px 28px; font-size: 23px; border-radius: 12px; }
#app { position: absolute; left: 810px; top: 80px; width: 1040px; height: 920px; border: 1px solid var(--line); border-radius: 26px; overflow: hidden; }
.view { position: absolute; inset: 0; padding: 26px 30px; opacity: 0; }
.rcard { padding: 20px 24px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
.rcard b { font-size: 21px; } .rcard span:not(.badge) { display: block; color: var(--muted); font-size: 16px; margin-top: 6px; }
.strip { display: flex; gap: 44px; padding: 18px 24px; margin-bottom: 18px; }
.strip label { display: block; font-size: 13px; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
.strip div { font-size: 22px; font-weight: 700; }
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
// Mon..Fri of Aug 31 to Sep 25, 2026: the board meets Thursday the 3rd, the books close Tuesday the 15th.
const DAYS = [
  31, 1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25,
]
const MEET = 3
const CLOSE = 11

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

// Blend two #rrggbb colours, so a highlight arrives instead of popping.
const mix = (a, b, p) => {
  const c = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16)
  return `rgb(${[0, 1, 2].map((i) => Math.round(c(a, i) + (c(b, i) - c(a, i)) * clamp01(p))).join(',')})`
}
// When "today" passes the board meeting on the calendar walk below.
const MISSED_AT = 1.2 + 1.4 * 0.4217

function setup(ctx) {
  const { $, root } = ctx
  $('calg').innerHTML = DAYS.map(
    (d, i) =>
      `<div class="day${i === 0 ? ' out' : ''}" id="d${i}">${d}` +
      (i === MEET
        ? '<span class="tag meet" id="tmeet">Board meeting</span>'
        : '') +
      (i === CLOSE
        ? '<span class="tag close" id="tclose">Books close</span>'
        : '') +
      '</div>'
  ).join('')
  const days = DAYS.map((_, i) => $('d' + i))
  const cmpRows = [...root.getElementById('cmp').rows]

  return (t) => {
    t = Math.max(0, Math.min(TOTAL, t))

    let lt = win($('s1'), t, S1, 0.45, 0.4)
    blurIn($('eb'), seg(lt, 0.05, 0.6), 12)
    ;['w1', 'w2', 'w3', 'w4'].forEach((w, i) =>
      blurIn($(w), seg(lt, 0.25 + i * 0.08, 0.85 + i * 0.08))
    )

    lt = win($('s2a'), t, S2A)
    rise($('bm'), eo(seg(lt, 0.2, 0.8)))
    rise($('rm'), eo(seg(lt, 1.5, 1.9)))
    $('rmt').textContent = typed('Let me get back to you.', lt, 1.9, 22)
    rise($('c2a'), eo(seg(lt, 2.6, 3.1)), 20)

    lt = win($('s2b'), t, S2B)
    rise($('cal'), eo(seg(lt, 0.05, 0.5)), 40)
    rise($('tmeet'), eo(seg(lt, 0.5, 0.8)), 10)
    rise($('tclose'), eo(seg(lt, 0.8, 1.1)), 10)
    // today walks from Sep 1 toward the close; the meeting goes by on the way
    // cells shade continuously as today passes them, rather than switching
    const now = 1 + (CLOSE - 1) * eio(seg(lt, 1.2, 2.6))
    days.forEach((d, i) => {
      if (i === 0) return
      const past = clamp01(now - i)
      const here = clamp01(1 - Math.abs(now - i))
      d.style.background = mix(mix('#17161c', '#1f1c29', past), '#2c2342', here)
      d.style.borderColor = mix('#25242c', '#8b5cf6', here)
    })
    const missed = lt >= MISSED_AT
    $('tmeet').className = 'tag ' + (missed ? 'miss' : 'meet')
    $('tmeet').textContent = missed ? 'No numbers yet' : 'Board meeting'
    if (lt > 1.2) $('tmeet').style.opacity = dip(lt, MISSED_AT)
    rise($('c2b'), eo(seg(lt, 1.7, 2.2)), 20)

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
    blurIn($('t1'), seg(lt, 0.1, 0.7))
    blurIn($('t2'), seg(lt, 0.6, 1.2))
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
          $('ts' + i).style.opacity = dip(bt, 1.75)
          $('tr' + i).textContent = b.res
          $('tr' + i).style.opacity = seg(bt, 1.75, 2.05)
          $('an' + i).innerHTML = answer(b.a, Math.floor((bt - 1.85) * 70))
          if (b.approve) {
            rise($('ap'), eo(seg(bt, 2.9, 3.2)), 10)
            pointer(ctx, $('cursor'), $('apgo'), bt, 3.0, 3.5)
            swap($('apgo'), bt, 3.55, 'Approve and close', 'Approved ✓')
            rise($('tl5'), eo(seg(bt, 3.75, 4.0)), 12)
            const cd = bt > 4.15
            $('ts5').innerHTML = cd
              ? '<span style="color:var(--good)">✓ done</span>'
              : `<span style="color:var(--muted)">${spin(bt)} running</span>`
            $('ts5').style.opacity = dip(bt, 4.15)
            $('tr5').textContent =
              'Posted 3 entries · closed through August 2026'
            $('tr5').style.opacity = seg(bt, 4.15, 4.45)
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
      // crossfade: the previous screen fades out as the next fades in
      const f = bi === 0 ? 1 : eio(seg(vt, 0, 0.45))
      for (let i = 0; i < 5; i++) {
        const v = $('v' + (i + 1))
        const p = i === vi ? f : i === vi - 1 ? 1 - f : 0
        v.style.opacity = p
        v.style.transform = `translateX(${(1 - p) * (i === vi ? 30 : -30)}px)`
      }
      ctx.nav(
        BEATS[vi].k,
        vi > 0 ? BEATS[vi - 1].k : BEATS[vi].k,
        seg(vt, 0, 0.7)
      )

      ctx.ring($('hl1'), $('arrow'), vi === 0 ? eo(seg(vt, 0.85, 1.2)) : 0)
      $('cashc').style.color = mix(
        '#f4f2fb',
        '#f87171',
        vi === 0 ? seg(vt, 0.85, 1.15) : 0
      )
      if (vi === 1) {
        rise($('rnew'), eo(seg(vt, 0.05, 0.4)), 20)
        swap($('rbadge'), vt, 0.75, 'Draft', 'Shared', [
          'badge b-warn',
          'badge b-good',
        ])
        swap(
          $('rsub'),
          vt,
          0.75,
          'Generated from the ledger · ties to trial balance',
          'Shared · Board · 3 recipients'
        )
        $('rnew').style.borderColor = mix(
          '#2a2833',
          '#e879f9',
          seg(vt, 0.75, 1.05)
        )
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
        // in this beat vt = bt - 1, so the close posts at vt 3.15
        SCHED.forEach((_, i) =>
          steps(
            $('sb' + i),
            vt,
            [0.3 + i * 0.15, 3.15],
            ['pending', 'drafted', 'posted'],
            ['badge b-mute', 'badge b-v', 'badge b-good']
          )
        )
        const ok = swap($('chk'), vt, 0.9, '-', '12 / 12 pass')
        $('chk').style.color = ok ? 'var(--good)' : ''
        const posted = swap(
          $('cthru'),
          vt,
          3.15,
          '🔒 July 2026',
          '🔒 August 2026'
        )
        $('cthru').style.color = posted ? 'var(--f400)' : ''
        swap($('ctgt'), vt, 3.15, 'August 2026', 'September 2026')
      }
    }

    // the end card fades into the background and the loop opens on the first scene:
    // no black dip
    lt = win($('s5'), t, S5, 0.5, 0.6)
    rise($('cl'), eo(seg(lt, 0.1, 0.5)), 20)
    blurIn($('cu'), seg(lt, 0.3, 0.9), 30)
    rise($('cn'), eo(seg(lt, 0.9, 1.3)), 20)
    rise($('cw'), eo(seg(lt, 1.3, 1.7)), 20)
    $('cd').style.opacity = seg(lt, 1.6, 2.0)
    $('cl').style.display = 'inline-block'
  }
}

// Phone layout: a 720-wide portrait stage, the chat stacked over the app,
// larger type throughout, and the connector flow turned vertical.
const phoneCss = `
.big { font-size: 74px; }
.eyebrow { font-size: 17px; letter-spacing: .18em; }
.caption { font-size: 34px; bottom: 64px; padding: 0 36px; line-height: 1.25; }
#bm { left: 40px !important; top: 190px !important; }
#rm { left: 40px !important; top: 520px !important; }
.msg { width: 640px; padding: 24px 28px; }
.msg p { font-size: 32px; }
.cal { left: 24px; top: 130px; width: 672px; padding: 20px 18px; }
.calh { gap: 8px; font-size: 16px; } .calh b { font-size: 26px; }
.calg { gap: 8px; }
.day { height: 118px; padding: 8px 10px; font-size: 22px; }
.tag { left: 6px; right: 6px; bottom: 6px; padding: 5px 7px; font-size: 17px; line-height: 1.15; }
.gchat { left: 24px; top: 220px; width: 672px; height: 400px; padding: 28px; }
.gchat .ub { font-size: 26px; }
.gchat .ans { font-size: 26px; }
#s3 .big { font-size: 54px !important; }
#s3 .center > div:last-child { flex-direction: column; margin-top: 50px !important; }
.wire { width: 3px; height: 34px; }
.node { font-size: 26px; padding: 16px 26px; }
.step { font-size: 24px; margin-bottom: 0; } .step i { font-size: 13px; margin-right: 10px; }
#chat { left: 20px; top: 20px; width: 680px; height: 560px; }
#chat .hd { height: 96px; padding: 14px 20px; }
#chat .hd .t { font-size: 17px; margin-bottom: 10px; }
.chip { font-size: 16px; padding: 6px 12px; }
#chatbody { top: 96px; }
.grp { left: 20px; right: 20px; top: 14px; gap: 10px; }
.ub { font-size: 24px; padding: 14px 18px; min-height: 56px; }
.tool { padding: 11px 14px; } .tool .tn { font-size: 17px; } .tool .tr { font-size: 18px; margin-top: 6px; }
.ans { font-size: 24px; }
.btn.lg { font-size: 20px; padding: 11px 20px; }
#app { left: 20px; top: 594px; width: 680px; height: 470px; }
.view { padding: 16px 18px; }
.rcard { padding: 14px 16px; margin-bottom: 10px; } .rcard b { font-size: 18px; }
.strip { gap: 22px; padding: 12px 16px; margin-bottom: 12px; } .strip div { font-size: 18px; }
#v3 svg { width: 100%; height: 290px; }
#v3 .card { padding: 12px 14px !important; }
#cu { font-size: 84px !important; }
#cn { font-size: 30px !important; padding: 0 30px; }
#cw { font-size: 22px !important; }
`

export default {
  width: 1920,
  height: 1080,
  total: TOTAL,
  poster: 22.6,
  css,
  html,
  setup,
  mobile: { width: 720, height: 1080, css: PHONE_APP_CSS + phoneCss },
}

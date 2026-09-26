/*
 * Spotlight: Close the period with guard rails. Schedules draft, the rule
 * checks tick through, a person clicks Close Period, and "closed through"
 * advances. Driftline's three real schedules for August 2026.
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

const SCHED = [
  ['Roasting & Packaging Line Depreciation', '$1,071.43'],
  ['Automated Packaging Line Depreciation', '$400.00'],
  ['Business Insurance Amortization', '$1,000.00'],
]
const CHECKS = 12

const main = `${pageHeader('Closing Book', 'Financial statements, schedules, and period close')}
  <div class="card strip">
    <span><label>Closed through</label><div id="thru"></div></span>
    <span><label>Close target</label><div id="tgt"></div></span>
    <span><label>Sync</label><div style="color:var(--good)">Fresh</div></span>
    <span><label>Checks</label><div id="chk"></div></span>
  </div>
  <table><tr><th>Schedule</th><th class="n">Amount</th><th>Status</th></tr>
    ${SCHED.map((s, i) => `<tr><td>${s[0]}</td><td class="n">${s[1]}</td><td><span class="badge" id="sb${i}"></span></td></tr>`).join('')}
  </table>
  <div class="card go-close" id="gc">
    <div><b id="gct">Close August 2026</b><span>Posts every draft entry in the period and advances closed through.</span></div>
    <span class="btn go" id="cp">Close Period</span>
  </div>`

const css = `
.strip { display: flex; gap: 40px; padding: 16px 22px; margin-bottom: 18px; }
.strip label { display: block; font-size: 13px; letter-spacing: .08em; color: var(--muted); text-transform: uppercase; margin-bottom: 6px; }
.strip div { font-size: 21px; font-weight: 700; }
.go-close { margin-top: 18px; padding: 18px 22px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.go-close b { font-size: 20px; } .go-close span:not(.btn) { display: block; color: var(--muted); font-size: 15px; margin-top: 4px; }
`

function setup(ctx) {
  const { $ } = ctx
  ctx.nav('close')
  return (t) => {
    pointer(ctx, $('cur'), $('cp'), t, 4.2, 4.9)
    SCHED.forEach((_, i) =>
      steps(
        $('sb' + i),
        t,
        [0.6 + i * 0.35, 5.2 + i * 0.12],
        ['pending', 'drafted', 'posted'],
        ['badge b-mute', 'badge b-v', 'badge b-good']
      )
    )
    push($('main'), t, 9.5, 700, 420)
    const n = Math.min(CHECKS, Math.max(0, Math.floor((t - 1.8) * 9)))
    $('chk').textContent = t < 1.8 ? '-' : `${n} / ${CHECKS} pass`
    $('chk').style.color = n === CHECKS ? 'var(--good)' : ''
    const closed = swap($('thru'), t, 5.7, '🔒 July 2026', '🔒 August 2026')
    $('thru').style.color = closed ? 'var(--f400)' : ''
    swap($('tgt'), t, 5.7, 'August 2026', 'September 2026')
    swap($('cp'), t, 5.7, 'Close Period', 'Closed ✓')
    // dimmed until the checks pass; the swap's dip applies on top
    $('cp').style.opacity = (0.4 + 0.6 * eo(seg(t, 2.8, 3.2))) * dip(t, 5.7)
    rise($('gc'), eo(seg(t, 0.2, 0.7)), 16)
  }
}

// Phone layout: larger type in a narrower stage.
const phoneCss = `
.strip { gap: 18px; padding: 12px 14px; flex-wrap: wrap; }
.strip label { font-size: 11px; } .strip div { font-size: 17px; }
.go-close { padding: 14px 16px; } .go-close b { font-size: 17px; } .go-close span:not(.btn) { font-size: 13px; }
`

export default {
  width: 1200,
  height: 750,
  total: 9.5,
  poster: 7.5,
  css,
  html:
    appChrome({ active: 'close', main }) +
    CURSOR.replace('class="cursor"', 'class="cursor" id="cur"'),
  setup,
  mobile: { width: 720, height: 740, css: PHONE_APP_CSS + phoneCss },
}

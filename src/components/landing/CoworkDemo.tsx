'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Animated emulation of the human-in-the-loop close: Claude drives the
 * RoboLedger tools over MCP while a person approves each step. Modeled on the
 * robosystems-app ConsoleDemo (IntersectionObserver start, sequential reveal,
 * progressive typing). Used in the hero until a real Claude cowork screenshot
 * is captured. Purely decorative — nothing here is interactive.
 */

type Step =
  | { kind: 'user'; text: string }
  | { kind: 'claude'; text: string }
  | { kind: 'approve' }
  | {
      kind: 'tool'
      tool: string
      arg?: string
      running: string
      result: string
      success?: boolean
    }

const SCRIPT: Step[] = [
  { kind: 'user', text: 'Close the books for May 2026.' },
  {
    kind: 'claude',
    text: "Let me review what's pending before we lock the period.",
  },
  {
    kind: 'tool',
    tool: 'roboledger.list_inbox_events',
    running: 'scanning inbox…',
    result: '3 events · all AI-classified, balanced',
  },
  {
    kind: 'claude',
    text: 'All three look right. Commit them and post the close schedules?',
  },
  { kind: 'approve' },
  { kind: 'user', text: 'Approved ✓' },
  {
    kind: 'tool',
    tool: 'roboledger.draft_closing_entries',
    running: 'posting schedules…',
    result: 'Depreciation + prepaid → 2 drafts, balanced',
  },
  {
    kind: 'tool',
    tool: 'roboledger.close_period',
    arg: '2026-05',
    running: 'validating & locking…',
    result: '✓ Rule engine 12/12 · closed through May 2026',
    success: true,
  },
]

function ProgressiveText({
  text,
  speed = 16,
  onComplete,
}: {
  text: string
  speed?: number
  onComplete?: () => void
}) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (n < text.length) {
      const t = setTimeout(() => setN(n + 1), speed)
      return () => clearTimeout(t)
    }
    if (!done.current) {
      done.current = true
      onComplete?.()
    }
  }, [n, text, speed, onComplete])
  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && (
        <span className="ml-0.5 inline-block animate-pulse text-gray-500">
          ▍
        </span>
      )}
    </span>
  )
}

function Avatar() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 ring-1 ring-gray-800">
      <Image
        src="/images/claude.svg"
        alt="Claude"
        width={14}
        height={14}
        className="h-3.5 w-3.5"
      />
    </span>
  )
}

function ToolRow({
  step,
  animating,
  onDone,
}: {
  step: Extract<Step, { kind: 'tool' }>
  animating: boolean
  onDone: () => void
}) {
  const [running, setRunning] = useState(animating)
  useEffect(() => {
    if (!animating) {
      setRunning(false)
      return
    }
    setRunning(true)
    const t1 = setTimeout(() => setRunning(false), 750)
    const t2 = setTimeout(onDone, 1150)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [animating, onDone])

  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        step.success && !running
          ? 'border-green-500/30 bg-green-950/20'
          : 'border-secondary-500/30 bg-secondary-950/25'
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px]">
        <svg
          className={`h-3 w-3 shrink-0 ${
            step.success && !running ? 'text-green-400' : 'text-secondary-300'
          } ${running ? 'animate-pulse' : ''}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-mono text-gray-300">
          {step.tool}
          <span className="text-gray-500">({step.arg ?? ''})</span>
        </span>
        <span className="ml-auto rounded bg-gray-800 px-1.5 py-0.5 text-[9px] tracking-wide text-gray-500 uppercase">
          MCP
        </span>
      </div>
      <div
        className={`mt-1 text-[11px] ${
          running
            ? 'text-gray-500'
            : step.success
              ? 'text-green-300'
              : 'text-gray-400'
        }`}
      >
        {running ? step.running : step.result}
      </div>
    </div>
  )
}

function ApproveRow({
  animating,
  onDone,
}: {
  animating: boolean
  onDone: () => void
}) {
  useEffect(() => {
    if (!animating) return
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [animating, onDone])
  return (
    <div className="flex gap-2">
      <span
        className={`rounded-md bg-green-500/15 px-2.5 py-1 text-[11px] font-medium text-green-300 ${
          animating ? 'ring-1 ring-green-500/40' : ''
        }`}
      >
        Approve &amp; continue
      </span>
      <span className="rounded-md border border-gray-700 px-2.5 py-1 text-[11px] font-medium text-gray-400">
        Review each
      </span>
    </div>
  )
}

export default function CoworkDemo() {
  const [revealed, setRevealed] = useState(0)
  const [started, setStarted] = useState(false)
  const [reduced, setReduced] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const next = useCallback(
    () => setRevealed((r) => Math.min(r + 1, SCRIPT.length)),
    []
  )

  useEffect(() => {
    setReduced(
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    )
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [revealed, started])

  return (
    <div
      ref={containerRef}
      className="flex h-[420px] flex-col bg-zinc-950 sm:h-[440px]"
    >
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 text-left sm:p-5"
      >
        {SCRIPT.map((step, i) => {
          const show = reduced || (started && i <= revealed)
          if (!show) return null
          const animating = !reduced && started && i === revealed
          const claudeSide = step.kind !== 'user'
          const withAvatar =
            claudeSide && (i === 0 || SCRIPT[i - 1].kind === 'user')

          if (step.kind === 'user') {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-primary-600/30 w-fit max-w-[82%] rounded-lg rounded-br-sm px-3 py-2 text-[12px] text-white">
                  {animating ? (
                    <ProgressiveText
                      text={step.text}
                      speed={22}
                      onComplete={next}
                    />
                  ) : (
                    step.text
                  )}
                </div>
              </div>
            )
          }

          const body =
            step.kind === 'claude' ? (
              <div className="rounded-lg rounded-tl-sm border border-gray-800 bg-zinc-900/70 px-3 py-2 text-[12px] leading-relaxed text-gray-200">
                {animating ? (
                  <ProgressiveText
                    text={step.text}
                    speed={14}
                    onComplete={next}
                  />
                ) : (
                  step.text
                )}
              </div>
            ) : step.kind === 'tool' ? (
              <ToolRow step={step} animating={animating} onDone={next} />
            ) : (
              <ApproveRow animating={animating} onDone={next} />
            )

          return (
            <div key={i} className="flex items-start gap-2">
              {withAvatar ? <Avatar /> : <span className="w-6 shrink-0" />}
              <div className="max-w-[86%] flex-1 space-y-2">{body}</div>
            </div>
          )
        })}
      </div>

      {/* faux input bar */}
      <div className="flex items-center gap-2 border-t border-gray-800 bg-zinc-900/60 px-4 py-2.5">
        <span className="text-secondary-400 text-xs">✳</span>
        <span className="text-[11px] text-gray-600">Message Claude…</span>
      </div>
    </div>
  )
}

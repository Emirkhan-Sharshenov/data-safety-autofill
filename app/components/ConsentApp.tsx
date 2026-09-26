'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { analyze as analyzeManifest } from '../../lib/analyzers/manifest'
import { analyze as analyzeDependencies } from '../../lib/analyzers/dependencies'
import { analyze as analyzeCode } from '../../lib/analyzers/code'
import { reconcile, type ReconcilerOutput, type ReconciledAnswer } from '../../lib/analyzers/reconcile'
import { DATA_TYPE_MAP, DATA_TYPE_TO_CATEGORY } from '../../lib/schema/data-safety-schema'
import type { FixtureInput, FixturesMap } from '../lib/fixtures'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnswerGroup {
  collected: ReconciledAnswer[]
  needsReview: ReconciledAnswer[]
  noEvidence: ReconciledAnswer[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function groupAnswers(answers: ReconciledAnswer[]): AnswerGroup {
  const collected: ReconciledAnswer[] = []
  const needsReview: ReconciledAnswer[] = []
  const noEvidence: ReconciledAnswer[] = []
  for (const a of answers) {
    if (a.collected) collected.push(a)
    else if (a.needsReview) needsReview.push(a)
    else noEvidence.push(a)
  }
  return { collected, needsReview, noEvidence }
}

function confidenceBadge(c: 'high' | 'medium' | 'low'): string {
  if (c === 'high') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  if (c === 'medium') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
}

function tierLabel(tier: string): string {
  if (tier === 'code') return 'Code'
  if (tier === 'dependency') return 'SDK'
  if (tier === 'manifest') return 'Manifest'
  return tier
}

function exportMarkdown(output: ReconcilerOutput, fixtureName: string): string {
  const { answers, summary } = output
  const lines: string[] = []
  lines.push(`# Google Play Data Safety — ${fixtureName}`)
  lines.push('')
  lines.push(`**Total collected:** ${summary.totalCollected}  `)
  lines.push(`**Found only through third-party SDKs:** ${summary.foundOnlyThroughDependencies}  `)
  lines.push(`**Needs review:** ${summary.needsReviewCount}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const answer of answers) {
    const def = DATA_TYPE_MAP[answer.dataType]
    const cat = DATA_TYPE_TO_CATEGORY[answer.dataType]
    const status = answer.collected ? '✅ Collected' : answer.needsReview ? '⚠️ Needs review' : '❌ Not collected'
    lines.push(`## ${cat?.label ?? ''} › ${def?.label ?? answer.dataType}`)
    lines.push('')
    lines.push(`**Status:** ${status}  `)
    lines.push(`**Confidence:** ${answer.confidence}  `)
    lines.push(`**Resolved by:** ${answer.resolvedBy}`)
    lines.push('')
    lines.push(`> ${answer.reasoning}`)
    if (answer.sources.length > 0) {
      lines.push('')
      lines.push('**Evidence:**')
      for (const src of answer.sources) {
        for (const ev of src.evidence) {
          lines.push(`- \`${ev.file}:${ev.line}\` — \`${ev.snippet}\``)
        }
      }
    }
    lines.push('')
  }
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EvidenceList({ answer }: { answer: ReconciledAnswer }) {
  const [open, setOpen] = useState(false)
  const allEvidence = answer.sources.flatMap((src) =>
    src.evidence.map((ev) => ({ ...ev, tier: src.tier }))
  )
  if (allEvidence.length === 0) return null
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
        aria-expanded={open}
      >
        {open ? '▾' : '▸'} {allEvidence.length} evidence {allEvidence.length === 1 ? 'item' : 'items'}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {allEvidence.map((ev, i) => (
            <div
              key={i}
              className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-xs font-mono"
            >
              <span className="text-slate-400 dark:text-slate-500 mr-2">
                [{tierLabel(ev.tier)}]
              </span>
              <span className="text-slate-500 dark:text-slate-400">{ev.file}:{ev.line}</span>
              <br />
              <span className="text-slate-700 dark:text-slate-300 break-all">{ev.snippet}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnswerRow({ answer }: { answer: ReconciledAnswer }) {
  const def = DATA_TYPE_MAP[answer.dataType]
  const cat = DATA_TYPE_TO_CATEGORY[answer.dataType]
  const isCollected = answer.collected
  const isReview = !isCollected && answer.needsReview

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-4 py-3">
      <div className="flex flex-wrap items-start gap-2">
        {/* Status indicator */}
        <span
          className={`mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${
            isCollected
              ? 'bg-blue-500'
              : isReview
              ? 'bg-amber-400'
              : 'bg-slate-300 dark:bg-slate-600'
          }`}
          style={{ marginTop: '6px' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">{cat?.label}</span>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="font-medium text-slate-800 dark:text-slate-100 text-sm">
              {def?.label ?? answer.dataType}
            </span>
            {/* Confidence badge */}
            <span
              className={`rounded px-1.5 py-0.5 text-xs font-medium ${confidenceBadge(answer.confidence)}`}
            >
              {answer.confidence}
            </span>
            {/* Resolved-by badge */}
            {answer.resolvedBy !== 'none' && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  answer.resolvedBy === 'dependency'
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                via {tierLabel(answer.resolvedBy)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-snug">
            {answer.reasoning}
          </p>
          <EvidenceList answer={answer} />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  count,
  color,
}: {
  title: string
  count: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className={`text-sm font-semibold ${color}`}>{title}</span>
      <span className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs px-2 py-0.5 font-medium">
        {count}
      </span>
    </div>
  )
}

function CollapsedNoEvidence({ answers }: { answers: ReconciledAnswer[] }) {
  const [open, setOpen] = useState(false)
  if (answers.length === 0) return null
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
        aria-expanded={open}
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>
          {answers.length} data type{answers.length !== 1 ? 's' : ''} with no evidence found
        </span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {answers.map((a) => (
            <AnswerRow key={a.dataType} answer={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function SummaryBar({ output }: { output: ReconcilerOutput }) {
  const { summary } = output
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4 mb-6">
      <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 text-center">
        {/* Total collected */}
        <div className="px-4">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {summary.totalCollected}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            data types<br />collected
          </div>
        </div>
        {/* SDK-only — headline metric */}
        <div className="px-4">
          <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
            {summary.foundOnlyThroughDependencies}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            found only via<br />
            <span className="font-semibold text-violet-600 dark:text-violet-400">
              third-party SDK
            </span>
          </div>
        </div>
        {/* Needs review */}
        <div className="px-4">
          <div className="text-3xl font-bold text-amber-500 dark:text-amber-400">
            {summary.needsReviewCount}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-tight">
            need<br />review
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultsPanel({
  output,
  fixtureName,
}: {
  output: ReconcilerOutput
  fixtureName: string
}) {
  const groups = useMemo(() => groupAnswers(output.answers), [output])

  const handleExport = useCallback(() => {
    const md = exportMarkdown(output, fixtureName)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-safety-${fixtureName.replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [output, fixtureName])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
          Data Safety form results
        </h2>
        <button
          onClick={handleExport}
          className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          ↓ Export Markdown
        </button>
      </div>

      <SummaryBar output={output} />

      {/* Collected */}
      {groups.collected.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Collected"
            count={groups.collected.length}
            color="text-blue-600 dark:text-blue-400"
          />
          <div className="space-y-2">
            {groups.collected.map((a) => (
              <AnswerRow key={a.dataType} answer={a} />
            ))}
          </div>
        </div>
      )}

      {/* Needs review */}
      {groups.needsReview.length > 0 && (
        <div className="mb-6">
          <SectionHeader
            title="Needs review"
            count={groups.needsReview.length}
            color="text-amber-600 dark:text-amber-400"
          />
          <div className="space-y-2">
            {groups.needsReview.map((a) => (
              <AnswerRow key={a.dataType} answer={a} />
            ))}
          </div>
        </div>
      )}

      {/* No evidence — collapsed */}
      <CollapsedNoEvidence answers={groups.noEvidence} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input panel
// ---------------------------------------------------------------------------

interface ManualInput {
  manifest: string
  gradle: string
}

function InputPanel({
  fixtures,
  defaultFixture,
  onRun,
}: {
  fixtures: FixturesMap
  defaultFixture: string
  onRun: (fixture: FixtureInput | null, manual: ManualInput | null) => void
}) {
  const [mode, setMode] = useState<'fixture' | 'manual'>('fixture')
  const [selectedFixture, setSelectedFixture] = useState(defaultFixture)
  const [manifest, setManifest] = useState('')
  const [gradle, setGradle] = useState('')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (mode === 'fixture') {
        onRun(fixtures[selectedFixture] ?? null, null)
      } else {
        onRun(null, { manifest, gradle })
      }
    },
    [mode, selectedFixture, manifest, gradle, fixtures, onRun]
  )

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-5 mb-6">
      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Android project input
      </h2>

      {/* Mode tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 w-fit">
        {(['fixture', 'manual'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none ${
              mode === m
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {m === 'fixture' ? 'Bundled fixture' : 'Paste code'}
          </button>
        ))}
      </div>

      {mode === 'fixture' ? (
        <div className="flex flex-col gap-3">
          <label className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            Select project
          </label>
          <select
            value={selectedFixture}
            onChange={(e) => setSelectedFixture(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(fixtures).map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              AndroidManifest.xml
            </label>
            <textarea
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              placeholder='<?xml version="1.0"...'
              rows={12}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              build.gradle / build.gradle.kts
            </label>
            <textarea
              value={gradle}
              onChange={(e) => setGradle(e.target.value)}
              placeholder="dependencies { ... }"
              rows={12}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Analyze →
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export default function ConsentApp({
  fixtures,
}: {
  fixtures: FixturesMap
}) {
  const DEFAULT_FIXTURE = 'mesh-network'

  const [output, setOutput] = useState<ReconcilerOutput | null>(() => {
    // Run analysis immediately on mount with the default fixture
    const f = fixtures[DEFAULT_FIXTURE]
    if (!f) return null
    return runAnalysis(f, null)
  })
  const [currentLabel, setCurrentLabel] = useState<string>(
    fixtures[DEFAULT_FIXTURE]?.label ?? 'mesh-network'
  )

  const handleRun = useCallback(
    (fixture: FixtureInput | null, manual: ManualInput | null) => {
      const result = runAnalysis(fixture, manual)
      setOutput(result)
      setCurrentLabel(
        fixture?.label ??
          (manual ? 'Custom input' : 'Unknown')
      )
    },
    []
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Consent
            </span>
            <span className="rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-semibold px-2 py-0.5">
              Data Safety Autofill
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fills Google Play&apos;s Data Safety form from Android project code — with file-and-line evidence for every answer.
          </p>
        </div>

        <InputPanel
          fixtures={fixtures}
          defaultFixture={DEFAULT_FIXTURE}
          onRun={handleRun}
        />

        {output && (
          <ResultsPanel output={output} fixtureName={currentLabel} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Analysis runner (pure, no React)
// ---------------------------------------------------------------------------

function runAnalysis(
  fixture: FixtureInput | null,
  manual: ManualInput | null
): ReconcilerOutput {
  let manifests: { filePath: string; content: string }[] = []
  let gradleFiles: { filePath: string; content: string }[] = []

  if (fixture) {
    manifests = fixture.manifests
    gradleFiles = fixture.gradleFiles
  } else if (manual) {
    if (manual.manifest.trim()) {
      manifests = [{ filePath: 'AndroidManifest.xml', content: manual.manifest }]
    }
    if (manual.gradle.trim()) {
      gradleFiles = [{ filePath: 'build.gradle', content: manual.gradle }]
    }
  }

  const manifestFindings = analyzeManifest({ manifests })
  const dependencyFindings = analyzeDependencies({ gradleFiles })
  const codeFindings = analyzeCode({ sourceFiles: [] })

  return reconcile({ manifestFindings, dependencyFindings, codeFindings })
}

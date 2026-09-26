/**
 * eval/run.ts — full pipeline evaluation over ne-prospi and mesh-network fixtures.
 *
 * Usage:
 *   npx tsx eval/run.ts
 *
 * Output:
 *   eval/findings.md  — per-project tables of every resolved data type
 */

import * as fs from 'fs'
import * as path from 'path'

import { analyze as analyzeManifest } from '../lib/analyzers/manifest'
import { analyze as analyzeDependencies } from '../lib/analyzers/dependencies'
import { analyze as analyzeCode } from '../lib/analyzers/code'
import { reconcile } from '../lib/analyzers/reconcile'
import { DATA_TYPE_MAP, ALL_DATA_TYPE_KEYS } from '../lib/schema/data-safety-schema'
import type { DataTypeKey } from '../lib/schema/data-safety-schema'

// ---------------------------------------------------------------------------
// File-system helpers
// ---------------------------------------------------------------------------

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

function walkSourceFiles(dir: string): { filePath: string; content: string }[] {
  if (!fs.existsSync(dir)) return []
  const results: { filePath: string; content: string }[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkSourceFiles(full))
    } else if (entry.isFile() && (entry.name.endsWith('.kt') || entry.name.endsWith('.java'))) {
      results.push({ filePath: full, content: readFile(full) })
    }
  }
  return results
}

function findFiles(dir: string, name: string): string[] {
  if (!fs.existsSync(dir)) return []
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findFiles(full, name))
    } else if (entry.isFile() && entry.name === name) {
      results.push(full)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// Run one project
// ---------------------------------------------------------------------------

interface ProjectResult {
  name: string
  elapsed: number // ms
  output: ReturnType<typeof reconcile>
}

function runProject(fixtureDir: string, displayName: string): ProjectResult {
  const start = Date.now()

  // Manifests — collect all AndroidManifest.xml found under the fixture
  const manifestPaths = findFiles(fixtureDir, 'AndroidManifest.xml')
  const manifests = manifestPaths.map((p) => ({
    filePath: p,
    content: readFile(p),
  }))

  // Gradle files — collect all build.gradle and build.gradle.kts
  const gradlePaths = [
    ...findFiles(fixtureDir, 'build.gradle'),
    ...findFiles(fixtureDir, 'build.gradle.kts'),
  ]
  const gradleFiles = gradlePaths.map((p) => ({
    filePath: p,
    content: readFile(p),
  }))

  // Source files — all .kt / .java under src/
  const srcDir = path.join(fixtureDir, 'src')
  const sourceFiles = walkSourceFiles(srcDir)

  // Run analyzers
  const manifestFindings = analyzeManifest({ manifests })
  const dependencyFindings = analyzeDependencies({ gradleFiles })
  const codeFindings = analyzeCode({ sourceFiles })

  // Reconcile
  const output = reconcile({ manifestFindings, dependencyFindings, codeFindings })

  const elapsed = Date.now() - start
  return { name: displayName, elapsed, output }
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function confidenceLabel(c: 'high' | 'medium' | 'low'): string {
  return c.charAt(0).toUpperCase() + c.slice(1)
}

function renderProjectSection(result: ProjectResult): string {
  const { name, elapsed, output } = result
  const { answers, summary } = output

  const lines: string[] = []
  lines.push(`## ${name}`)
  lines.push('')
  lines.push(
    `_Analysis time: ${elapsed} ms — ` +
      `${summary.totalCollected} data types collected, ` +
      `${summary.foundOnlyThroughDependencies} found only through dependencies, ` +
      `${summary.needsReviewCount} need review_`,
  )
  lines.push('')

  // Table header
  lines.push('| Data type | Collected | Confidence | Resolved by | Note |')
  lines.push('| --- | --- | --- | --- | --- |')

  // Only emit rows for types that have some evidence or are collected
  // Show ALL types for completeness, mark empty ones as "—"
  for (const answer of answers) {
    const label = DATA_TYPE_MAP[answer.dataType]?.label ?? answer.dataType
    const collected = answer.collected ? '✅ Yes' : 'No'
    const conf = answer.collected || answer.needsReview ? confidenceLabel(answer.confidence) : '—'
    const resolvedBy = answer.resolvedBy !== 'none' ? answer.resolvedBy : '—'
    let note = ''
    if (answer.manifestOnlyDowngraded) note = 'manifest-only → downgraded'
    else if (answer.needsReview) note = 'needs review'
    lines.push(`| ${label} | ${collected} | ${conf} | ${resolvedBy} | ${note} |`)
  }

  lines.push('')

  // Summary counters
  lines.push('### Summary')
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('| --- | --- |')
  lines.push(`| Total data types | ${answers.length} |`)
  lines.push(`| Collected | **${summary.totalCollected}** |`)
  lines.push(`| Found only through dependencies | **${summary.foundOnlyThroughDependencies}** |`)
  lines.push(`| Needs review | ${summary.needsReviewCount} |`)
  lines.push(`| Analysis time | ${elapsed} ms |`)
  lines.push('')

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures')
const OUTPUT_PATH = path.resolve(__dirname, 'findings.md')

const projects: { dir: string; name: string }[] = [
  { dir: path.join(FIXTURES_DIR, 'ne-prospi'), name: 'ne-prospi' },
  { dir: path.join(FIXTURES_DIR, 'mesh-network'), name: 'mesh-network' },
]

const overallStart = Date.now()
const results: ProjectResult[] = projects.map(({ dir, name }) => runProject(dir, name))
const overallElapsed = Date.now() - overallStart

const sections: string[] = [
  '# Findings — Data Safety Analysis',
  '',
  `_Generated: ${new Date().toISOString()}_`,
  `_Total pipeline time (both projects): ${overallElapsed} ms_`,
  '',
]

for (const result of results) {
  sections.push(renderProjectSection(result))
}

const markdown = sections.join('\n')
fs.writeFileSync(OUTPUT_PATH, markdown, 'utf-8')
console.log(`Wrote ${OUTPUT_PATH}`)

// Print summary to stdout for inline reporting
console.log('\n=== SUMMARY ===')
for (const result of results) {
  const { name, elapsed, output } = result
  const { summary } = output
  console.log(`\n[${name}]`)
  console.log(`  Analysis time:                    ${elapsed} ms`)
  console.log(`  Total collected:                  ${summary.totalCollected}`)
  console.log(`  Found only through dependencies:  ${summary.foundOnlyThroughDependencies}`)
  console.log(`  Needs review:                     ${summary.needsReviewCount}`)
  // Per-resolver counts
  const byTier: Record<string, number> = { code: 0, dependency: 0, manifest: 0, none: 0 }
  for (const a of output.answers) {
    if (a.collected) byTier[a.resolvedBy] = (byTier[a.resolvedBy] ?? 0) + 1
  }
  console.log(`  Resolved by code:       ${byTier.code}`)
  console.log(`  Resolved by dependency: ${byTier.dependency}`)
  console.log(`  Resolved by manifest:   ${byTier.manifest}`)

  // Per-type details for collected items
  console.log(`  Collected types:`)
  for (const a of output.answers) {
    if (a.collected) {
      const label = DATA_TYPE_MAP[a.dataType]?.label ?? a.dataType
      console.log(`    - ${label} (${a.confidence}, ${a.resolvedBy})`)
    }
  }
}

console.log(`\n[total pipeline time] ${overallElapsed} ms`)
console.log('\nDone.')

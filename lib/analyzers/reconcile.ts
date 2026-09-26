// Reconciler — combines findings from all three analyzers into one answer per data type.
// No React imports. Must be unit-testable without a browser.

import type { DataTypeKey } from '../schema/data-safety-schema'
import { ALL_DATA_TYPE_KEYS } from '../schema/data-safety-schema'
import type { Finding as ManifestFinding } from './manifest'
import type { Finding as DependencyFinding } from './dependencies'
import type { Finding as CodeFinding } from './code'

// ---------------------------------------------------------------------------
// Unified finding type (union of the three source types)
// ---------------------------------------------------------------------------

/** Source tier, ordered by authority: code > dependency > manifest. */
export type EvidenceTier = 'code' | 'dependency' | 'manifest'

/** A finding from any one of the three analyzers, tagged with its source. */
export interface SourceFinding {
  tier: EvidenceTier
  dataType: DataTypeKey
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  evidence: { file: string; line: number; snippet: string }[]
  needsReview?: boolean
}

// ---------------------------------------------------------------------------
// Reconciled answer
// ---------------------------------------------------------------------------

/**
 * The final answer for one data type, ready to fill a form field.
 *
 * - `collected` / `shared`: the reconciler's verdict.
 * - `needsReview`: true if the winning evidence is unconfirmed (carries through).
 * - `sources`: every contributing finding attached so the UI can show the full
 *   evidence trail.
 * - `resolvedBy`: the tier that provided the winning evidence.
 * - `manifestOnlyDowngraded`: true when a manifest capability existed but no
 *   code or dependency evidence supported it — resolved to not-collected with a note.
 */
export interface ReconciledAnswer {
  dataType: DataTypeKey
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  needsReview: boolean
  resolvedBy: EvidenceTier | 'none'
  manifestOnlyDowngraded: boolean
  sources: SourceFinding[]
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

/**
 * Top-level summary of all reconciled answers.
 *
 * `foundOnlyThroughDependencies` is the headline metric of the project:
 * data types where a third-party SDK lookup is the only signal (no manifest
 * permission and no code egress corroborates it). This field is computed here,
 * not derived in the UI.
 */
export interface ReconcilerSummary {
  /** Total data types that resolved to collected:true. */
  totalCollected: number
  /**
   * Data types where the only positive evidence came from a dependency (SDK)
   * lookup — no manifest permission and no code evidence supports it.
   * This is the headline metric demonstrating the value of dependency analysis.
   */
  foundOnlyThroughDependencies: number
  /** Total data types where needsReview is true. */
  needsReviewCount: number
}

// ---------------------------------------------------------------------------
// Reconciler input / output
// ---------------------------------------------------------------------------

export interface ReconcilerInput {
  manifestFindings: ManifestFinding[]
  dependencyFindings: DependencyFinding[]
  codeFindings: CodeFinding[]
}

export interface ReconcilerOutput {
  answers: ReconciledAnswer[]
  summary: ReconcilerSummary
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TIER_RANK: Record<EvidenceTier, number> = {
  code: 2,
  dependency: 1,
  manifest: 0,
}

/** Convert findings from each analyzer into tagged SourceFindings. */
function tagFindings(
  manifestFindings: ManifestFinding[],
  dependencyFindings: DependencyFinding[],
  codeFindings: CodeFinding[],
): SourceFinding[] {
  const tagged: SourceFinding[] = []

  for (const f of manifestFindings) {
    tagged.push({ tier: 'manifest', ...f, needsReview: f.needsReview ?? false })
  }
  for (const f of dependencyFindings) {
    tagged.push({ tier: 'dependency', ...f, needsReview: f.needsReview ?? false })
  }
  for (const f of codeFindings) {
    tagged.push({ tier: 'code', ...f, needsReview: f.needsReview ?? false })
  }

  return tagged
}

/** Pick the best (highest-tier, then highest-confidence) finding from a group. */
function pickWinner(group: SourceFinding[]): SourceFinding {
  const CONF_RANK: Record<string, number> = { high: 2, medium: 1, low: 0 }
  return group.reduce((best, f) => {
    const tierDiff = TIER_RANK[f.tier] - TIER_RANK[best.tier]
    if (tierDiff > 0) return f
    if (tierDiff < 0) return best
    // Same tier — prefer higher confidence
    return CONF_RANK[f.confidence] > CONF_RANK[best.confidence] ? f : best
  })
}

// ---------------------------------------------------------------------------
// reconcile()
// ---------------------------------------------------------------------------

export function reconcile(input: ReconcilerInput): ReconcilerOutput {
  const allTagged = tagFindings(
    input.manifestFindings,
    input.dependencyFindings,
    input.codeFindings,
  )

  // Group all tagged findings by dataType
  const byDataType = new Map<DataTypeKey, SourceFinding[]>()
  for (const f of allTagged) {
    if (!byDataType.has(f.dataType)) byDataType.set(f.dataType, [])
    byDataType.get(f.dataType)!.push(f)
  }

  const answers: ReconciledAnswer[] = []

  // Produce one answer per data type in the schema (not just types with findings)
  for (const dataType of ALL_DATA_TYPE_KEYS) {
    const group = byDataType.get(dataType)

    if (!group || group.length === 0) {
      // No evidence at all → not collected, no review needed
      answers.push({
        dataType,
        collected: false,
        shared: false,
        confidence: 'high',
        reasoning: 'No evidence found across manifest, dependencies, or source code.',
        needsReview: false,
        resolvedBy: 'none',
        manifestOnlyDowngraded: false,
        sources: [],
      })
      continue
    }

    const winner = pickWinner(group)

    // Manifest-only downgrade rule:
    // If the highest-tier evidence is manifest, there is no code or dependency
    // support. A permission alone does not confirm collection (per the schema
    // critical distinction). Resolve to not-collected with an explanatory note.
    const hasCodeOrDep = group.some((f) => f.tier === 'code' || f.tier === 'dependency')
    const manifestOnlyDowngraded = winner.tier === 'manifest' && !hasCodeOrDep

    let collected: boolean
    let reasoning: string

    if (manifestOnlyDowngraded) {
      collected = false
      reasoning =
        `Manifest declares a permission that may indicate access to ${dataType}, ` +
        `but no code egress or SDK evidence was found to confirm transmission off-device. ` +
        `Resolved to not collected.`
    } else {
      collected = winner.collected
      reasoning = winner.reasoning
    }

    answers.push({
      dataType,
      collected,
      shared: winner.shared,
      confidence: winner.confidence,
      reasoning,
      needsReview: winner.needsReview ?? false,
      resolvedBy: winner.tier,
      manifestOnlyDowngraded,
      sources: group,
    })
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------

  let totalCollected = 0
  let foundOnlyThroughDependencies = 0
  let needsReviewCount = 0

  for (const answer of answers) {
    if (answer.collected) totalCollected++
    if (answer.needsReview) needsReviewCount++

    if (answer.collected && answer.resolvedBy === 'dependency') {
      // Dependency-only: verify no manifest or code finding also exists for
      // this type (they could exist but lost the ranking contest — check the
      // sources array to see if any code/manifest finding also has collected:true)
      const hasCollectingCodeOrManifest = answer.sources.some(
        (s) => (s.tier === 'code' || s.tier === 'manifest') && s.collected,
      )
      if (!hasCollectingCodeOrManifest) foundOnlyThroughDependencies++
    }
  }

  return {
    answers,
    summary: { totalCollected, foundOnlyThroughDependencies, needsReviewCount },
  }
}

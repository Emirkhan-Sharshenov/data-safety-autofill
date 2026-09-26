import { describe, it, expect } from 'vitest'
import { reconcile } from '../reconcile'
import type { ReconcilerInput } from '../reconcile'
import type { Finding as ManifestFinding } from '../manifest'
import type { Finding as DependencyFinding } from '../dependencies'
import type { Finding as CodeFinding } from '../code'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function manifestFinding(partial: Partial<ManifestFinding> & { dataType: ManifestFinding['dataType'] }): ManifestFinding {
  return {
    collected: false,
    shared: false,
    confidence: 'medium',
    reasoning: 'manifest finding',
    evidence: [{ file: 'AndroidManifest.xml', line: 1, snippet: '<uses-permission/>' }],
    ...partial,
  }
}

function dependencyFinding(partial: Partial<DependencyFinding> & { dataType: DependencyFinding['dataType'] }): DependencyFinding {
  return {
    collected: true,
    shared: true,
    confidence: 'medium',
    reasoning: 'dependency finding',
    evidence: [{ file: 'build.gradle', line: 5, snippet: 'implementation("some:sdk:1.0")' }],
    ...partial,
  }
}

function codeFinding(partial: Partial<CodeFinding> & { dataType: CodeFinding['dataType'] }): CodeFinding {
  return {
    collected: true,
    shared: false,
    confidence: 'high',
    reasoning: 'code finding',
    evidence: [{ file: 'MainActivity.kt', line: 42, snippet: 'logEvent("screen_view")' }],
    ...partial,
  }
}

const EMPTY: ReconcilerInput = {
  manifestFindings: [],
  dependencyFindings: [],
  codeFindings: [],
}

// ---------------------------------------------------------------------------
// 1. Conflicting evidence — code wins over dependency, dependency over manifest
// ---------------------------------------------------------------------------

describe('conflicting evidence — tier priority', () => {
  it('code finding wins over a dependency finding for the same data type', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({
          dataType: 'crashLogs',
          collected: false,
          confidence: 'low',
          reasoning: 'dep says no',
        }),
      ],
      codeFindings: [
        codeFinding({
          dataType: 'crashLogs',
          collected: true,
          confidence: 'high',
          reasoning: 'code says yes',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'crashLogs')!

    expect(answer.collected).toBe(true)
    expect(answer.resolvedBy).toBe('code')
    expect(answer.reasoning).toBe('code says yes')
  })

  it('dependency finding wins over a manifest finding for the same data type', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      manifestFindings: [
        manifestFinding({
          dataType: 'contacts',
          collected: false,
          confidence: 'medium',
          reasoning: 'manifest says permission only',
        }),
      ],
      dependencyFindings: [
        dependencyFinding({
          dataType: 'contacts',
          collected: true,
          confidence: 'medium',
          reasoning: 'sdk says collected',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'contacts')!

    expect(answer.collected).toBe(true)
    expect(answer.resolvedBy).toBe('dependency')
    expect(answer.reasoning).toBe('sdk says collected')
  })

  it('all three tiers present — code wins', () => {
    const input: ReconcilerInput = {
      manifestFindings: [manifestFinding({ dataType: 'appInteractions', collected: false })],
      dependencyFindings: [dependencyFinding({ dataType: 'appInteractions', collected: true, confidence: 'medium', reasoning: 'dep' })],
      codeFindings: [codeFinding({ dataType: 'appInteractions', collected: true, confidence: 'high', reasoning: 'code wins' })],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'appInteractions')!

    expect(answer.resolvedBy).toBe('code')
    expect(answer.reasoning).toBe('code wins')
  })

  it('all three contributing findings are kept in sources', () => {
    const input: ReconcilerInput = {
      manifestFindings: [manifestFinding({ dataType: 'appInteractions', collected: false })],
      dependencyFindings: [dependencyFinding({ dataType: 'appInteractions', collected: true })],
      codeFindings: [codeFinding({ dataType: 'appInteractions', collected: true })],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'appInteractions')!

    expect(answer.sources).toHaveLength(3)
    const tiers = answer.sources.map((s) => s.tier)
    expect(tiers).toContain('manifest')
    expect(tiers).toContain('dependency')
    expect(tiers).toContain('code')
  })
})

// ---------------------------------------------------------------------------
// 2. Manifest-only capability → resolves to not collected
// ---------------------------------------------------------------------------

describe('manifest-only capability', () => {
  it('resolves collected:false when only a manifest finding exists', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      manifestFindings: [
        manifestFinding({
          dataType: 'calendarEvents',
          collected: false,
          confidence: 'medium',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'calendarEvents')!

    expect(answer.collected).toBe(false)
    expect(answer.manifestOnlyDowngraded).toBe(true)
    expect(answer.resolvedBy).toBe('manifest')
  })

  it('downgraded answer reasoning explains the missing egress evidence', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      manifestFindings: [manifestFinding({ dataType: 'preciseLocation', collected: false })],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'preciseLocation')!

    expect(answer.reasoning).toMatch(/no code egress or SDK evidence/)
    expect(answer.reasoning).toMatch(/Resolved to not collected/)
  })

  it('manifest finding is still kept in sources for the UI evidence trail', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      manifestFindings: [manifestFinding({ dataType: 'filesAndDocs' })],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'filesAndDocs')!

    expect(answer.sources).toHaveLength(1)
    expect(answer.sources[0].tier).toBe('manifest')
  })

  it('manifestOnlyDowngraded is false when code also supports the type', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      manifestFindings: [manifestFinding({ dataType: 'preciseLocation' })],
      codeFindings: [codeFinding({ dataType: 'preciseLocation', collected: true })],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'preciseLocation')!

    expect(answer.manifestOnlyDowngraded).toBe(false)
    expect(answer.collected).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 3. Dependency-only finding → counted in foundOnlyThroughDependencies
// ---------------------------------------------------------------------------

describe('dependency-only finding', () => {
  it('is counted in summary.foundOnlyThroughDependencies', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({
          dataType: 'deviceOrOtherIds',
          collected: true,
          reasoning: 'Firebase SDK collects device IDs',
        }),
      ],
    }

    const { summary } = reconcile(input)
    expect(summary.foundOnlyThroughDependencies).toBe(1)
  })

  it('is NOT counted in foundOnlyThroughDependencies when code also collects it', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({ dataType: 'deviceOrOtherIds', collected: true }),
      ],
      codeFindings: [
        codeFinding({ dataType: 'deviceOrOtherIds', collected: true }),
      ],
    }

    const { summary } = reconcile(input)
    // Code wins the ranking, but the dep finding also has collected:true → not dep-only
    expect(summary.foundOnlyThroughDependencies).toBe(0)
  })

  it('resolves to collected:true when dependency has collected:true and no other tier exists', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({
          dataType: 'crashLogs',
          collected: true,
          shared: true,
          confidence: 'medium',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'crashLogs')!

    expect(answer.collected).toBe(true)
    expect(answer.shared).toBe(true)
    expect(answer.resolvedBy).toBe('dependency')
  })

  it('summary.totalCollected includes dependency-only types', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({ dataType: 'appInteractions', collected: true }),
        dependencyFinding({ dataType: 'diagnostics', collected: true }),
      ],
    }

    const { summary } = reconcile(input)
    expect(summary.totalCollected).toBeGreaterThanOrEqual(2)
    expect(summary.foundOnlyThroughDependencies).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// 4. needsReview propagation
// ---------------------------------------------------------------------------

describe('needsReview propagation', () => {
  it('carries needsReview:true from a code finding to the reconciled answer', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      codeFindings: [
        codeFinding({
          dataType: 'approximateLocation',
          collected: false,
          confidence: 'medium',
          needsReview: true,
          reasoning: 'location read; network egress present but type unconfirmed',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'approximateLocation')!

    expect(answer.needsReview).toBe(true)
    expect(answer.collected).toBe(false)
  })

  it('is counted in summary.needsReviewCount', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      codeFindings: [
        codeFinding({ dataType: 'approximateLocation', collected: false, needsReview: true }),
        codeFinding({ dataType: 'preciseLocation', collected: false, needsReview: true }),
      ],
    }

    const { summary } = reconcile(input)
    expect(summary.needsReviewCount).toBe(2)
  })

  it('a winning code finding with needsReview:true prevents a confident false positive', () => {
    // Even though a dependency says collected:true (no needsReview),
    // the code finding is higher tier and it says needsReview:true.
    // The final answer must still carry needsReview from the winner.
    const input: ReconcilerInput = {
      ...EMPTY,
      dependencyFindings: [
        dependencyFinding({
          dataType: 'preciseLocation',
          collected: true,
          needsReview: false,
        }),
      ],
      codeFindings: [
        codeFinding({
          dataType: 'preciseLocation',
          collected: false,
          confidence: 'medium',
          needsReview: true,
          reasoning: 'location read, egress unconfirmed',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'preciseLocation')!

    expect(answer.resolvedBy).toBe('code')
    expect(answer.needsReview).toBe(true)
    expect(answer.collected).toBe(false)
  })

  it('does not carry needsReview when the winner has needsReview:false', () => {
    const input: ReconcilerInput = {
      ...EMPTY,
      codeFindings: [
        codeFinding({
          dataType: 'crashLogs',
          collected: true,
          confidence: 'high',
          needsReview: false,
          reasoning: 'Crashlytics call confirmed',
        }),
      ],
    }

    const { answers } = reconcile(input)
    const answer = answers.find((a) => a.dataType === 'crashLogs')!

    expect(answer.needsReview).toBe(false)
    expect(answer.collected).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 5. Summary field correctness
// ---------------------------------------------------------------------------

describe('summary fields', () => {
  it('totalCollected is 0 when all inputs are empty', () => {
    const { summary } = reconcile(EMPTY)
    expect(summary.totalCollected).toBe(0)
    expect(summary.foundOnlyThroughDependencies).toBe(0)
    expect(summary.needsReviewCount).toBe(0)
  })

  it('produces one answer per schema data type regardless of input coverage', () => {
    const { answers } = reconcile(EMPTY)
    // ALL_DATA_TYPE_KEYS has a fixed count — just verify uniqueness and non-empty
    const keys = answers.map((a) => a.dataType)
    const unique = new Set(keys)
    expect(unique.size).toBe(answers.length)
    expect(answers.length).toBeGreaterThan(0)
  })

  it('answers with no evidence have resolvedBy:none and empty sources', () => {
    const { answers } = reconcile(EMPTY)
    for (const a of answers) {
      expect(a.resolvedBy).toBe('none')
      expect(a.sources).toHaveLength(0)
    }
  })
})

// Code analyzer — scans source files for data access and network egress patterns.
// No React imports. No browser APIs. Pure TypeScript, no external dependencies.
//
// Design: patterns are split into two kinds:
//   DATA_READ  — an API that accesses a data type on-device.
//   EGRESS     — a call that sends data off the device (network, remote SDK).
//
// collected:true requires both a read AND egress. A read without observed
// egress yields collected:false with needsReview:true.
// confidence:'high' is only emitted when egress of a specific type is proven.

import type { DataTypeKey } from '../schema/data-safety-schema'

export interface Finding {
  dataType: DataTypeKey
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  evidence: { file: string; line: number; snippet: string }[]
  needsReview?: boolean
}

export interface SourceFile {
  filePath: string
  content: string
}

export interface CodeAnalyzerInput {
  sourceFiles: SourceFile[]
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

type PatternKind = 'DATA_READ' | 'EGRESS'

interface PatternRule {
  kind: PatternKind
  regex: RegExp
  dataType: DataTypeKey
  confidence: 'high' | 'medium' | 'low'
  reasoning: string // used only when this rule alone drives the finding
}

// EGRESS patterns — these prove data leaves the device.
// Each is tagged with the dataType of the data being transmitted.
const EGRESS_RULES: PatternRule[] = [
  {
    kind: 'EGRESS',
    regex: /\.enqueue\(|OkHttpClient|\.newCall\(|HttpURLConnection|\.openConnection\(/i,
    dataType: 'otherActions',
    confidence: 'high',
    reasoning: 'Network call detected — data is transmitted to a remote endpoint.',
  },
  {
    kind: 'EGRESS',
    regex: /retrofit.*interface|@GET|@POST|@PUT|@DELETE|@PATCH/i,
    dataType: 'otherActions',
    confidence: 'high',
    reasoning: 'Retrofit API interface or annotation detected — data is sent via HTTP.',
  },
  {
    kind: 'EGRESS',
    // logEvent is an SDK upload call, not a local read
    regex: /firebaseAnalytics\.logEvent|Analytics\.logEvent|logEvent\(/i,
    dataType: 'appInteractions',
    confidence: 'high',
    reasoning:
      'Analytics logEvent call detected — app interaction data is sent to a remote analytics service.',
  },
  {
    kind: 'EGRESS',
    regex: /Crashlytics\.log|FirebaseCrashlytics\.getInstance|recordException/i,
    dataType: 'crashLogs',
    confidence: 'high',
    reasoning: 'Crashlytics call detected — crash data is sent to a remote service.',
  },
]

// DATA_READ patterns — the API is accessed on-device; egress is not proven.
const DATA_READ_RULES: PatternRule[] = [
  {
    kind: 'DATA_READ',
    // Fused Location Provider and explicit location update requests
    regex: /fusedLocationClient|requestLocationUpdates|LocationRequest/i,
    dataType: 'preciseLocation',
    confidence: 'medium',
    reasoning:
      'Precise location API access detected with no observed egress — data is read on-device.',
  },
  {
    kind: 'DATA_READ',
    regex: /lastKnownLocation|getCurrentLocation|getLastLocation/i,
    dataType: 'approximateLocation',
    confidence: 'medium',
    reasoning:
      'Location read detected with no observed egress — data is accessed on-device.',
  },
  {
    kind: 'DATA_READ',
    regex: /TelephonyManager|getDeviceId\(\)|getImei\(\)/i,
    dataType: 'deviceOrOtherIds',
    confidence: 'medium',
    reasoning:
      'Device identifier API access detected with no observed egress — identifier is read on-device.',
  },
  {
    kind: 'DATA_READ',
    regex: /ContactsContract|resolver\.query.*contacts/i,
    dataType: 'contacts',
    confidence: 'medium',
    reasoning:
      'Contacts API access detected with no observed egress — contact data is read on-device.',
  },
  {
    kind: 'DATA_READ',
    regex: /MediaRecorder|AudioRecord/i,
    dataType: 'voiceOrSoundRecordings',
    confidence: 'medium',
    reasoning:
      'Audio recording API access detected with no observed egress — audio is captured on-device.',
  },
  {
    kind: 'DATA_READ',
    // Torch/flash APIs excluded: setTorchMode, FLASH_INFO_AVAILABLE, TORCH_MODE
    // Photo capture means: ImageReader, takePicture, ImageCapture, ACTION_IMAGE_CAPTURE
    regex: /ImageReader|takePicture|ImageCapture|ACTION_IMAGE_CAPTURE/i,
    dataType: 'photos',
    confidence: 'medium',
    reasoning:
      'Photo capture API access detected with no observed egress — image data is captured on-device.',
  },
  {
    kind: 'DATA_READ',
    regex: /Log\.d\(|Log\.e\(|Log\.i\(|Log\.w\(|Log\.v\(/,
    dataType: 'diagnostics',
    confidence: 'low',
    reasoning:
      'Android Log call detected — diagnostic data is written to local logcat, not transmitted.',
  },
]

const ALL_RULES = [...EGRESS_RULES, ...DATA_READ_RULES]

// ---------------------------------------------------------------------------
// Evidence accumulator types
// ---------------------------------------------------------------------------

type Evidence = { file: string; line: number; snippet: string }

interface Accumulator {
  reads: Evidence[]
  egress: Evidence[]
  readRule?: PatternRule
  egressRule?: PatternRule
}

// ---------------------------------------------------------------------------
// analyze()
// ---------------------------------------------------------------------------

export function analyze(input: CodeAnalyzerInput): Finding[] {
  if (input.sourceFiles.length === 0) return []

  // Per-dataType accumulators
  const acc = new Map<DataTypeKey, Accumulator>()

  const getAcc = (dt: DataTypeKey): Accumulator => {
    let a = acc.get(dt)
    if (!a) {
      a = { reads: [], egress: [] }
      acc.set(dt, a)
    }
    return a
  }

  for (const { filePath, content } of input.sourceFiles) {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const snippet = line.trim()
      if (!snippet) continue

      for (const rule of ALL_RULES) {
        if (rule.regex.test(line)) {
          const a = getAcc(rule.dataType)
          const ev: Evidence = { file: filePath, line: i + 1, snippet }
          if (rule.kind === 'EGRESS') {
            a.egress.push(ev)
            if (!a.egressRule) a.egressRule = rule
          } else {
            a.reads.push(ev)
            if (!a.readRule) a.readRule = rule
          }
        }
      }
    }
  }

  const findings: Finding[] = []

  // Whether any generic network egress was observed anywhere in the input.
  // Used to upgrade DATA_READ findings from "no egress" to "unconfirmed egress".
  const hasNetworkEgress = (acc.get('otherActions')?.egress.length ?? 0) > 0

  for (const [dataType, { reads, egress, readRule, egressRule }] of acc) {
    // Guard: no empty evidence
    const allEvidence = [...reads, ...egress]
    if (allEvidence.length === 0) continue

    const hasDedicatedEgress = egress.length > 0

    if (hasDedicatedEgress && reads.length === 0) {
      // Pure dedicated egress (network call, analytics upload, etc.)
      findings.push({
        dataType,
        collected: true,
        shared: false,
        confidence: egressRule!.confidence,
        reasoning: egressRule!.reasoning,
        evidence: egress,
      })
    } else if (hasDedicatedEgress && reads.length > 0) {
      // Dedicated egress rule AND a read rule for the same type — proven egress
      findings.push({
        dataType,
        collected: true,
        shared: false,
        confidence: 'high',
        reasoning: `${dataType} data is read and dedicated egress is observed in the same codebase.`,
        evidence: allEvidence,
      })
    } else if (reads.length > 0) {
      // Data accessed on-device; no dedicated egress for this type.
      const rule = readRule!
      if (hasNetworkEgress && rule.confidence !== 'low') {
        // Generic network egress is present — transmission of this specific type is unconfirmed.
        findings.push({
          dataType,
          collected: false,
          shared: false,
          confidence: 'medium',
          reasoning: `${dataType} data is read on-device; network egress is present but transmission of this specific type is unconfirmed.`,
          evidence: reads,
          needsReview: true,
        })
      } else {
        // No network egress — data is processed entirely on-device.
        const f: Finding = {
          dataType,
          collected: false,
          shared: false,
          confidence: rule.confidence,
          reasoning: rule.reasoning,
          evidence: reads,
        }
        if (rule.confidence !== 'low') f.needsReview = true
        findings.push(f)
      }
    }
  }

  return findings
}

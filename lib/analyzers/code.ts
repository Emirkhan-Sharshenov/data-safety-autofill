// Code analyzer — scans source files for patterns indicating data egress.
// No React imports. No browser APIs. Pure TypeScript, no external dependencies.

import type { DataTypeKey } from '../schema/data-safety-schema'

export interface Finding {
  dataType: DataTypeKey
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  evidence: { file: string; line: number; snippet: string }[]
}

export interface SourceFile {
  filePath: string
  content: string
}

export interface CodeAnalyzerInput {
  sourceFiles: SourceFile[]
}

interface PatternRule {
  regex: RegExp
  dataType: DataTypeKey
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
}

const RULES: PatternRule[] = [
  {
    regex: /\.enqueue\(|OkHttpClient|\.newCall\(|HttpURLConnection|\.openConnection\(/i,
    dataType: 'otherActions',
    confidence: 'high',
    reasoning: 'Network call detected — data is actively transmitted to a remote endpoint.',
  },
  {
    regex: /retrofit.*interface|@GET|@POST|@PUT|@DELETE|@PATCH/i,
    dataType: 'otherActions',
    confidence: 'high',
    reasoning: 'Retrofit API interface or annotation detected — data is sent via HTTP.',
  },
  {
    regex: /fusedLocationClient|getLastLocation|requestLocationUpdates|LocationRequest/i,
    dataType: 'preciseLocation',
    confidence: 'high',
    reasoning:
      'Fused Location Provider call detected — precise location is actively read and likely transmitted.',
  },
  {
    regex: /lastKnownLocation|getCurrentLocation/i,
    dataType: 'approximateLocation',
    confidence: 'high',
    reasoning: 'Location read detected — approximate location may be transmitted.',
  },
  {
    regex: /firebaseAnalytics\.logEvent|Analytics\.logEvent|logEvent\(/i,
    dataType: 'appInteractions',
    confidence: 'high',
    reasoning:
      'Firebase/analytics logEvent call detected — app interaction data is sent to a remote analytics service.',
  },
  {
    regex: /Crashlytics\.log|FirebaseCrashlytics|recordException/i,
    dataType: 'crashLogs',
    confidence: 'high',
    reasoning: 'Crashlytics call detected — crash/error data is sent to a remote service.',
  },
  {
    regex: /TelephonyManager|getDeviceId\(\)|getImei\(\)/i,
    dataType: 'deviceOrOtherIds',
    confidence: 'high',
    reasoning: 'Device identifier read detected — device ID is accessed and may be transmitted.',
  },
  {
    regex: /ContactsContract|resolver\.query.*contacts/i,
    dataType: 'contacts',
    confidence: 'high',
    reasoning: 'Contacts query detected — contact data is accessed and may be transmitted.',
  },
  {
    regex: /MediaRecorder|AudioRecord/i,
    dataType: 'voiceOrSoundRecordings',
    confidence: 'high',
    reasoning: 'Audio recording API detected — voice/sound data is captured.',
  },
  {
    regex: /Camera|CameraManager|ImageCapture/i,
    dataType: 'photos',
    confidence: 'high',
    reasoning: 'Camera API detected — photo/image data may be captured.',
  },
  {
    regex: /Log\.d\(|Log\.e\(|Log\.i\(|Log\.w\(|Log\.v\(/,
    dataType: 'diagnostics',
    confidence: 'low',
    reasoning:
      'Android Log call detected — diagnostic data may be written to logcat (low risk, local only).',
  },
]

const CONFIDENCE_RANK: Record<'high' | 'medium' | 'low', number> = { high: 2, medium: 1, low: 0 }

export function analyze(input: CodeAnalyzerInput): Finding[] {
  // Map from dataType -> { confidence, reasoning, evidence[] }
  const hits = new Map<
    DataTypeKey,
    { confidence: 'high' | 'medium' | 'low'; reasoning: string; evidence: Finding['evidence'] }
  >()

  for (const { filePath, content } of input.sourceFiles) {
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      for (const rule of RULES) {
        if (rule.regex.test(line)) {
          const existing = hits.get(rule.dataType)
          if (!existing) {
            hits.set(rule.dataType, {
              confidence: rule.confidence,
              reasoning: rule.reasoning,
              evidence: [{ file: filePath, line: i + 1, snippet: line.trim() }],
            })
          } else {
            // Upgrade confidence if this hit is higher
            if (CONFIDENCE_RANK[rule.confidence] > CONFIDENCE_RANK[existing.confidence]) {
              existing.confidence = rule.confidence
              existing.reasoning = rule.reasoning
            }
            existing.evidence.push({ file: filePath, line: i + 1, snippet: line.trim() })
          }
        }
      }
    }
  }

  const findings: Finding[] = []
  for (const [dataType, { confidence, reasoning, evidence }] of hits) {
    // Guard: never emit a finding with empty evidence (should never occur, but be safe)
    if (evidence.length === 0) continue
    findings.push({
      dataType,
      collected: true,
      shared: true,
      confidence,
      reasoning,
      evidence,
    })
  }

  return findings
}

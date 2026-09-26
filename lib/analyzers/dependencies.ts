// Dependencies analyzer — parses Gradle files to detect known SDKs and their data practices.
// No React imports. Must be unit-testable without a browser.

import type { DataTypeKey } from '../schema/data-safety-schema'

export interface Finding {
  dataType: DataTypeKey
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  reasoning: string
  evidence: { file: string; line: number; snippet: string }[]
}

export interface GradleFile {
  filePath: string
  content: string
}

export interface DependencyAnalyzerInput {
  gradleFiles: GradleFile[]
}

// ---------------------------------------------------------------------------
// SDK lookup table
// ---------------------------------------------------------------------------

interface SdkEntry {
  /** Substring to match against "group:artifact" (no version) */
  pattern: string
  dataTypes: DataTypeKey[]
  collected: boolean
  shared: boolean
  confidence: 'high' | 'medium' | 'low'
  sdkName: string
  description: string
}

const SDK_TABLE: SdkEntry[] = [
  {
    pattern: 'com.google.firebase:firebase-analytics',
    dataTypes: ['appInteractions', 'diagnostics', 'deviceOrOtherIds'],
    collected: true,
    shared: true,
    confidence: 'medium',
    sdkName: 'Firebase Analytics',
    description: 'collects app interaction events, diagnostics, and device identifiers for analytics',
  },
  {
    pattern: 'com.google.firebase:firebase-crashlytics',
    dataTypes: ['crashLogs', 'deviceOrOtherIds'],
    collected: true,
    shared: true,
    confidence: 'medium',
    sdkName: 'Firebase Crashlytics',
    description: 'collects crash logs and device identifiers for crash reporting',
  },
  {
    pattern: 'com.google.android.gms:play-services-ads',
    dataTypes: ['appInteractions', 'deviceOrOtherIds', 'otherPersonalInfo'],
    collected: true,
    shared: true,
    confidence: 'medium',
    sdkName: 'Google Play Services Ads',
    description: 'collects app interactions, device IDs, and personal info for advertising',
  },
  {
    pattern: 'com.google.android.gms:play-services-location',
    dataTypes: ['preciseLocation', 'approximateLocation'],
    collected: true,
    shared: false,
    confidence: 'medium',
    sdkName: 'Google Play Services Location',
    description: 'collects precise and approximate location data via the Fused Location Provider',
  },
  {
    pattern: 'com.google.android.gms:play-services-nearby',
    dataTypes: ['deviceOrOtherIds', 'otherActions'],
    collected: true,
    shared: false,
    confidence: 'medium',
    sdkName: 'Google Play Services Nearby',
    description: 'collects device identifiers and nearby-device interaction data',
  },
  {
    pattern: 'com.google.android.gms:play-services-auth',
    dataTypes: ['name', 'emailAddress', 'userIds'],
    collected: true,
    shared: false,
    confidence: 'medium',
    sdkName: 'Google Sign-In',
    description: 'collects name, email address, and user IDs for Google authentication',
  },
  {
    pattern: 'com.squareup.okhttp3:okhttp',
    dataTypes: ['otherActions'],
    collected: false,
    shared: false,
    confidence: 'low',
    sdkName: 'OkHttp',
    description: 'may facilitate network actions that involve transmitting data',
  },
  {
    pattern: 'com.squareup.retrofit2:retrofit',
    dataTypes: ['otherActions'],
    collected: false,
    shared: false,
    confidence: 'low',
    sdkName: 'Retrofit',
    description: 'may facilitate network actions that involve transmitting data',
  },
  {
    pattern: 'org.osmdroid:osmdroid-android',
    dataTypes: ['approximateLocation', 'preciseLocation'],
    collected: false,
    shared: false,
    confidence: 'medium',
    sdkName: 'osmdroid',
    description: 'provides map rendering that may use approximate or precise location data',
  },
  {
    pattern: 'androidx.room:room-runtime',
    dataTypes: ['otherUserGeneratedContent'],
    collected: false,
    shared: false,
    confidence: 'low',
    sdkName: 'Room',
    description: 'persists user-generated content locally via a SQLite database',
  },
  {
    pattern: 'androidx.work:work-runtime',
    dataTypes: ['otherActions'],
    collected: false,
    shared: false,
    confidence: 'low',
    sdkName: 'WorkManager',
    description: 'schedules background actions that may involve data processing',
  },
  {
    pattern: 'com.google.crypto.tink:tink-android',
    dataTypes: ['otherActions'],
    collected: false,
    shared: false,
    confidence: 'low',
    sdkName: 'Tink',
    description: 'performs cryptographic actions on data',
  },
]

const SUSPICIOUS_KEYWORDS = ['analytics', 'tracking', 'ads', 'firebase', 'crashlytics']

// ---------------------------------------------------------------------------
// Regex to extract dependency strings from Gradle files
// ---------------------------------------------------------------------------

// Matches: implementation("group:artifact:version") or implementation 'group:artifact:version'
// Also api(...), testImplementation(...), etc.
const DEP_REGEX = /[a-zA-Z]+\s*[\('"]\s*["']?([A-Za-z0-9.\-_:]+)["']?\s*[,\)'"]/g

function extractDependencies(content: string): { dep: string; line: number; snippet: string }[] {
  const results: { dep: string; line: number; snippet: string }[] = []
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    let match: RegExpExecArray | null
    const re = new RegExp(DEP_REGEX.source, 'g')
    while ((match = re.exec(line)) !== null) {
      const dep = match[1]
      // Must look like group:artifact (at least one colon)
      if (dep.includes(':')) {
        results.push({ dep, line: i + 1, snippet: line.trim() })
      }
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// analyze
// ---------------------------------------------------------------------------

export function analyze(input: DependencyAnalyzerInput): Finding[] {
  if (!input.gradleFiles || input.gradleFiles.length === 0) return []

  // dataType -> Finding (first-wins dedup)
  const findingMap = new Map<DataTypeKey, Finding>()

  for (const gradleFile of input.gradleFiles) {
    const deps = extractDependencies(gradleFile.content)

    for (const { dep, line, snippet } of deps) {
      // Strip version: "group:artifact:version" -> "group:artifact"
      const parts = dep.split(':')
      const groupArtifact = parts.slice(0, 2).join(':')

      const sdkEntry = SDK_TABLE.find((e) => groupArtifact === e.pattern)

      if (sdkEntry) {
        const evidence = { file: gradleFile.filePath, line, snippet }
        for (const dataType of sdkEntry.dataTypes) {
          if (!findingMap.has(dataType)) {
            findingMap.set(dataType, {
              dataType,
              collected: sdkEntry.collected,
              shared: sdkEntry.shared,
              confidence: sdkEntry.confidence,
              reasoning: `${sdkEntry.sdkName} ${sdkEntry.description}.`,
              evidence: [evidence],
            })
          }
        }
      } else {
        // Check for suspicious unrecognized dependencies
        const depLower = dep.toLowerCase()
        const isSuspicious = SUSPICIOUS_KEYWORDS.some((kw) => depLower.includes(kw))
        if (isSuspicious) {
          const dt: DataTypeKey = 'otherActions'
          if (!findingMap.has(dt)) {
            findingMap.set(dt, {
              dataType: dt,
              collected: false,
              shared: false,
              confidence: 'low',
              reasoning: `Unrecognized dependency "${dep}" contains suspicious keywords and needs manual review.`,
              evidence: [{ file: gradleFile.filePath, line, snippet }],
            })
          }
        }
      }
    }
  }

  return Array.from(findingMap.values())
}

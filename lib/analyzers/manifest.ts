// Manifest analyzer — no React imports, no browser APIs.
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

export interface ManifestEntry {
  filePath: string
  content: string
}

export interface ManifestAnalyzerInput {
  manifests: ManifestEntry[]
}

// Maps the short permission name (after the last dot) to DataTypeKeys
const PERMISSION_MAP: Record<string, DataTypeKey[]> = {
  ACCESS_FINE_LOCATION: ['preciseLocation'],
  ACCESS_COARSE_LOCATION: ['approximateLocation'],
  READ_CONTACTS: ['contacts'],
  READ_CALL_LOG: ['otherActions'],
  READ_SMS: ['smsOrMms'],
  RECORD_AUDIO: ['voiceOrSoundRecordings'],
  CAMERA: ['photos', 'videos'],
  READ_MEDIA_IMAGES: ['photos'],
  READ_MEDIA_VIDEO: ['videos'],
  READ_EXTERNAL_STORAGE: ['filesAndDocs'],
  READ_CALENDAR: ['calendarEvents'],
  POST_NOTIFICATIONS: ['appInteractions'],
  FOREGROUND_SERVICE_LOCATION: ['preciseLocation'],
  FOREGROUND_SERVICE_MEDIA_PLAYBACK: ['voiceOrSoundRecordings'],
}

// Maps foregroundServiceType token values to DataTypeKeys
const FOREGROUND_SERVICE_TYPE_MAP: Record<string, DataTypeKey[]> = {
  location: ['preciseLocation'],
  FOREGROUND_SERVICE_LOCATION: ['preciseLocation'],
  mediaPlayback: ['voiceOrSoundRecordings'],
}

interface RawHit {
  dataType: DataTypeKey
  file: string
  line: number
  snippet: string
  permissionName: string
}

function extractPermissionName(nameAttr: string): string {
  // android.permission.ACCESS_FINE_LOCATION -> ACCESS_FINE_LOCATION
  const dot = nameAttr.lastIndexOf('.')
  return dot >= 0 ? nameAttr.slice(dot + 1) : nameAttr
}

function processManifest(entry: ManifestEntry): RawHit[] {
  const hits: RawHit[] = []
  const lines = entry.content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const raw = lines[i]
    const trimmed = raw.trim()

    // Match <uses-permission android:name="..." />
    const permMatch = trimmed.match(/android:name="([^"]+)"/)
    if (permMatch && trimmed.includes('uses-permission')) {
      const fullName = permMatch[1]
      const shortName = extractPermissionName(fullName)
      const dataTypes = PERMISSION_MAP[shortName]
      if (dataTypes) {
        for (const dataType of dataTypes) {
          hits.push({
            dataType,
            file: entry.filePath,
            line: lineNum,
            snippet: trimmed,
            permissionName: shortName,
          })
        }
      }
    }

    // Match foregroundServiceType="..." on <service> lines
    const fgTypeMatch = trimmed.match(/android:foregroundServiceType="([^"]+)"/)
    if (fgTypeMatch) {
      const tokens = fgTypeMatch[1].split('|').map((t) => t.trim())
      for (const token of tokens) {
        const dataTypes = FOREGROUND_SERVICE_TYPE_MAP[token]
        if (dataTypes) {
          for (const dataType of dataTypes) {
            hits.push({
              dataType,
              file: entry.filePath,
              line: lineNum,
              snippet: trimmed,
              permissionName: `foregroundServiceType:${token}`,
            })
          }
        }
      }
    }
  }

  return hits
}

export function analyze(input: ManifestAnalyzerInput): Finding[] {
  const allHits: RawHit[] = input.manifests.flatMap(processManifest)

  // Group by dataType, merging evidence
  const byDataType = new Map<DataTypeKey, RawHit[]>()
  for (const hit of allHits) {
    if (!byDataType.has(hit.dataType)) {
      byDataType.set(hit.dataType, [])
    }
    byDataType.get(hit.dataType)!.push(hit)
  }

  const findings: Finding[] = []
  for (const [dataType, hits] of byDataType) {
    if (hits.length === 0) continue
    // Use the first hit's permissionName for the reasoning sentence
    const firstHit = hits[0]
    findings.push({
      dataType,
      collected: false,
      shared: false,
      confidence: 'medium',
      reasoning: `The \`${firstHit.permissionName}\` permission indicates the app may access ${dataType}, but does not confirm collection.`,
      evidence: hits.map((h) => ({ file: h.file, line: h.line, snippet: h.snippet })),
    })
  }

  return findings
}

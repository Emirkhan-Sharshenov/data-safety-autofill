import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, it, expect } from 'vitest'
import { analyze } from '../manifest'
import type { ManifestEntry } from '../manifest'

const root = process.cwd()

function loadManifest(relativePath: string): ManifestEntry {
  return {
    filePath: relativePath,
    content: readFileSync(join(root, relativePath), 'utf-8'),
  }
}

const MANIFEST_1 = 'fixtures/ne-prospi/app/src/main/AndroidManifest.xml'
const MANIFEST_2 = 'fixtures/ne-prospi/ne-prospi-android/app/src/main/AndroidManifest.xml'

describe('manifest analyzer — ne-prospi fixtures', () => {
  const findings = analyze({
    manifests: [loadManifest(MANIFEST_1), loadManifest(MANIFEST_2)],
  })

  it('produces a Finding for preciseLocation with confidence medium', () => {
    const f = findings.find((x) => x.dataType === 'preciseLocation')
    expect(f).toBeDefined()
    expect(f!.confidence).toBe('medium')
  })

  it('produces a Finding for approximateLocation with confidence medium', () => {
    const f = findings.find((x) => x.dataType === 'approximateLocation')
    expect(f).toBeDefined()
    expect(f!.confidence).toBe('medium')
  })

  it('produces a Finding for voiceOrSoundRecordings (from mediaPlayback foregroundServiceType)', () => {
    const f = findings.find((x) => x.dataType === 'voiceOrSoundRecordings')
    expect(f).toBeDefined()
    expect(f!.confidence).toBe('medium')
  })

  it('every Finding has at least one evidence entry', () => {
    for (const f of findings) {
      expect(f.evidence.length).toBeGreaterThan(0)
    }
  })

  it('no Finding has confidence high', () => {
    for (const f of findings) {
      expect(f.confidence).not.toBe('high')
    }
  })
})

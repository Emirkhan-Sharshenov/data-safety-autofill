import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { analyze } from '../dependencies'
import type { Finding } from '../dependencies'

const fixturesDir = join(process.cwd(), 'fixtures', 'ne-prospi')

function loadGradleFile(relativePath: string) {
  const filePath = join(fixturesDir, relativePath)
  return {
    filePath: `fixtures/ne-prospi/${relativePath}`,
    content: readFileSync(filePath, 'utf-8'),
  }
}

describe('dependencies analyzer', () => {
  it('returns [] when gradleFiles is empty', () => {
    expect(analyze({ gradleFiles: [] })).toEqual([])
  })

  describe('ne-prospi fixtures', () => {
    const gradleFiles = [
      loadGradleFile('app/build.gradle.kts'),
      loadGradleFile('ne-prospi-android/app/build.gradle.kts'),
    ]

    let findings: Finding[]

    it('runs without throwing', () => {
      expect(() => {
        findings = analyze({ gradleFiles })
      }).not.toThrow()
      findings = analyze({ gradleFiles })
    })

    it('produces at least one Finding for approximateLocation (from osmdroid)', () => {
      const results = analyze({ gradleFiles })
      const found = results.find((f) => f.dataType === 'approximateLocation')
      expect(found).toBeDefined()
    })

    it('produces at least one Finding for preciseLocation (from osmdroid)', () => {
      const results = analyze({ gradleFiles })
      const found = results.find((f) => f.dataType === 'preciseLocation')
      expect(found).toBeDefined()
    })

    it('every Finding has at least one evidence entry', () => {
      const results = analyze({ gradleFiles })
      expect(results.length).toBeGreaterThan(0)
      for (const finding of results) {
        expect(finding.evidence.length).toBeGreaterThan(0)
      }
    })
  })
})

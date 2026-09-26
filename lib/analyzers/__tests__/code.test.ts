import { describe, it, expect } from 'vitest'
import { analyze } from '../code'

const syntheticKotlin = `
  val client = OkHttpClient()
  val request = Request.Builder().url(url).build()
  client.newCall(request).enqueue(callback)
  fusedLocationClient.getLastLocation()
  locationManager.lastKnownLocation(provider)
  Log.d("TAG", "debug message")
`

describe('analyze', () => {
  it('returns [] for empty sourceFiles', () => {
    expect(analyze({ sourceFiles: [] })).toEqual([])
  })

  it('finds otherActions with confidence high (OkHttp network calls)', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    const f = findings.find((x) => x.dataType === 'otherActions')
    expect(f).toBeDefined()
    expect(f!.confidence).toBe('high')
  })

  it('finds approximateLocation (from getLastLocation)', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    const f = findings.find((x) => x.dataType === 'approximateLocation')
    expect(f).toBeDefined()
  })

  it('finds diagnostics with confidence low (from Log.d)', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    const f = findings.find((x) => x.dataType === 'diagnostics')
    expect(f).toBeDefined()
    expect(f!.confidence).toBe('low')
  })

  it('every Finding has at least one evidence entry', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    expect(findings.length).toBeGreaterThan(0)
    for (const f of findings) {
      expect(f.evidence.length).toBeGreaterThan(0)
    }
  })

  it('getLastLocation also triggers preciseLocation (fusedLocationClient on the same line)', () => {
    // fusedLocationClient.getLastLocation() should hit the preciseLocation rule
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    const precise = findings.find((x) => x.dataType === 'preciseLocation')
    expect(precise).toBeDefined()
    expect(precise!.confidence).toBe('high')
  })

  it('evidence snippets are trimmed line text', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'src/main/java/MyService.kt', content: syntheticKotlin }],
    })
    for (const f of findings) {
      for (const e of f.evidence) {
        expect(e.snippet).toBe(e.snippet.trim())
        expect(e.file).toBe('src/main/java/MyService.kt')
        expect(e.line).toBeGreaterThan(0)
      }
    }
  })

  it('groups hits from multiple files into one Finding per dataType', () => {
    const file1 = { filePath: 'A.kt', content: 'val c = OkHttpClient()' }
    const file2 = { filePath: 'B.kt', content: 'val r = client.newCall(req).enqueue(cb)' }
    const findings = analyze({ sourceFiles: [file1, file2] })
    const f = findings.filter((x) => x.dataType === 'otherActions')
    expect(f).toHaveLength(1)
    expect(f[0].evidence).toHaveLength(2)
    expect(f[0].evidence[0].file).toBe('A.kt')
    expect(f[0].evidence[1].file).toBe('B.kt')
  })
})

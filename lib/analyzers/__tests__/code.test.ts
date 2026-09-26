import { describe, it, expect } from 'vitest'
import { analyze } from '../code'

// ---------------------------------------------------------------------------
// Synthetic snippets
// ---------------------------------------------------------------------------

// Network egress only (no data read) — proves otherActions collected:true
const networkOnly = `
  val client = OkHttpClient()
  client.newCall(request).enqueue(callback)
`

// Location read only — no network call
const locationReadOnly = `
  fusedLocationClient.requestLocationUpdates(request, callback, looper)
`

// Location read + network egress in the same file
const locationWithEgress = `
  fusedLocationClient.requestLocationUpdates(request, callback, looper)
  val client = OkHttpClient()
  client.newCall(request).enqueue(callback)
`

// Camera torch/flash APIs only — must NOT produce a photos finding
const torchOnly = `
  cameraManager.setTorchMode(cameraId, true)
  val available = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE)
  val torchMode = CameraCharacteristics.FLASH_MODE_TORCH
`

// Actual photo capture APIs — must produce a photos finding
const photoCaptureOnly = `
  val imageReader = ImageReader.newInstance(width, height, format, maxImages)
  camera.takePicture(null, null, pictureCallback)
`

// Log calls only — diagnostics, collected:false, confidence:low
const logOnly = `
  Log.d("TAG", "step reached")
  Log.e("TAG", "error happened")
`

// Broad synthetic for the original "all together" scenario
const fullSynthetic = `
  val client = OkHttpClient()
  val request = Request.Builder().url(url).build()
  client.newCall(request).enqueue(callback)
  fusedLocationClient.requestLocationUpdates(req, cb, looper)
  locationManager.lastKnownLocation(provider)
  Log.d("TAG", "debug message")
`

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('analyze()', () => {
  it('returns [] for empty sourceFiles', () => {
    expect(analyze({ sourceFiles: [] })).toEqual([])
  })

  // --- otherActions (pure EGRESS) ---

  it('network egress yields otherActions with collected:true and confidence:high', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Net.kt', content: networkOnly }] })
    const f = findings.find((x) => x.dataType === 'otherActions')
    expect(f).toBeDefined()
    expect(f!.collected).toBe(true)
    expect(f!.confidence).toBe('high')
  })

  // --- location read without egress → collected:false ---

  it('location read without egress yields preciseLocation with collected:false', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Loc.kt', content: locationReadOnly }] })
    const f = findings.find((x) => x.dataType === 'preciseLocation')
    expect(f).toBeDefined()
    expect(f!.collected).toBe(false)
    expect(f!.confidence).toBe('medium')
    expect(f!.needsReview).toBe(true)
  })

  it('location read without egress does NOT emit confidence:high', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Loc.kt', content: locationReadOnly }] })
    for (const f of findings) {
      if (f.dataType === 'preciseLocation' || f.dataType === 'approximateLocation') {
        expect(f.confidence).not.toBe('high')
      }
    }
  })

  // --- location read + generic network egress → collected:false, needsReview:true ---
  // Generic network egress cannot prove that location specifically is transmitted,
  // so the finding is collected:false with needsReview:true (not a false positive).

  it('location read with generic network egress yields preciseLocation collected:false and needsReview:true', () => {
    const findings = analyze({
      sourceFiles: [{ filePath: 'Service.kt', content: locationWithEgress }],
    })
    const f = findings.find((x) => x.dataType === 'preciseLocation')
    expect(f).toBeDefined()
    expect(f!.collected).toBe(false)
    expect(f!.needsReview).toBe(true)
    expect(f!.confidence).toBe('medium')
  })

  // --- torch / flash APIs must NOT produce a photos finding ---

  it('torch and flash APIs do not produce a photos finding', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Torch.kt', content: torchOnly }] })
    const photosF = findings.find((x) => x.dataType === 'photos')
    expect(photosF).toBeUndefined()
  })

  // --- actual photo capture APIs DO produce a photos finding ---

  it('ImageReader / takePicture produces a photos finding', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Camera.kt', content: photoCaptureOnly }] })
    const f = findings.find((x) => x.dataType === 'photos')
    expect(f).toBeDefined()
    expect(f!.collected).toBe(false) // no egress observed
    expect(f!.needsReview).toBe(true)
  })

  // --- diagnostics (Log.*) ---

  it('Log.d produces diagnostics with collected:false and confidence:low', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Log.kt', content: logOnly }] })
    const f = findings.find((x) => x.dataType === 'diagnostics')
    expect(f).toBeDefined()
    expect(f!.collected).toBe(false)
    expect(f!.confidence).toBe('low')
    // low-confidence reads are not flagged needsReview
    expect(f!.needsReview).toBeUndefined()
  })

  // --- reasoning strings must not hedge ---

  it('reasoning strings contain no hedging words (may, might, likely, could)', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'All.kt', content: fullSynthetic }] })
    for (const f of findings) {
      expect(f.reasoning).not.toMatch(/\bmay\b|\bmight\b|\blikely\b|\bcould\b/i)
    }
  })

  // --- evidence invariants ---

  it('every Finding has at least one evidence entry', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'All.kt', content: fullSynthetic }] })
    expect(findings.length).toBeGreaterThan(0)
    for (const f of findings) {
      expect(f.evidence.length).toBeGreaterThan(0)
    }
  })

  it('evidence snippets are trimmed and carry correct file and line metadata', () => {
    const findings = analyze({ sourceFiles: [{ filePath: 'Net.kt', content: networkOnly }] })
    for (const f of findings) {
      for (const e of f.evidence) {
        expect(e.snippet).toBe(e.snippet.trim())
        expect(e.file).toBe('Net.kt')
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

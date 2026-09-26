// Fixture data for bundled Android projects.
// Loaded server-side in page.tsx and passed as props to the client component.
// Source files are loaded lazily per-fixture to keep the initial payload small.

export interface FixtureInput {
  id: string
  label: string
  manifests: { filePath: string; content: string }[]
  gradleFiles: { filePath: string; content: string }[]
  sourceFiles: { filePath: string; content: string }[]
}

export type FixturesMap = Record<string, FixtureInput>

import { readFileSync, readdirSync } from 'fs'
import path from 'path'

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
}

/** Read all *.kt files from a directory, returning them as SourceFile entries. */
function readKtDir(dir: string): { filePath: string; content: string }[] {
  const abs = path.join(process.cwd(), dir)
  return readdirSync(abs)
    .filter((f) => f.endsWith('.kt'))
    .map((f) => ({
      filePath: `${dir}/${f}`,
      content: readFileSync(path.join(abs, f), 'utf8'),
    }))
}

export function loadFixtures(): FixturesMap {
  return {
    'mesh-network': {
      id: 'mesh-network',
      label: 'mesh-network (P2P messenger)',
      manifests: [
        {
          filePath: 'app/src/main/AndroidManifest.xml',
          content: read('fixtures/mesh-network/app/src/main/AndroidManifest.xml'),
        },
      ],
      gradleFiles: [
        {
          filePath: 'app/build.gradle.kts',
          content: read('fixtures/mesh-network/app/build.gradle.kts'),
        },
      ],
      sourceFiles: readKtDir('fixtures/mesh-network/src'),
    },
    'ne-prospi': {
      id: 'ne-prospi',
      label: 'ne-prospi (Alarm clock / transit)',
      manifests: [
        {
          filePath: 'app/src/main/AndroidManifest.xml',
          content: read('fixtures/ne-prospi/app/src/main/AndroidManifest.xml'),
        },
        {
          filePath: 'ne-prospi-android/app/src/main/AndroidManifest.xml',
          content: read('fixtures/ne-prospi/ne-prospi-android/app/src/main/AndroidManifest.xml'),
        },
      ],
      gradleFiles: [
        {
          filePath: 'app/build.gradle.kts',
          content: read('fixtures/ne-prospi/app/build.gradle.kts'),
        },
        {
          filePath: 'ne-prospi-android/app/build.gradle.kts',
          content: read('fixtures/ne-prospi/ne-prospi-android/app/build.gradle.kts'),
        },
      ],
      sourceFiles: readKtDir('fixtures/ne-prospi/src'),
    },
  }
}

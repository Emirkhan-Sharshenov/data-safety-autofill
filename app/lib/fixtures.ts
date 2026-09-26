// Fixture data for bundled Android projects.
// Loaded server-side in page.tsx and passed as props to the client component.

export interface FixtureInput {
  id: string
  label: string
  manifests: { filePath: string; content: string }[]
  gradleFiles: { filePath: string; content: string }[]
}

export type FixturesMap = Record<string, FixtureInput>

import { readFileSync } from 'fs'
import path from 'path'

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8')
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
    },
  }
}

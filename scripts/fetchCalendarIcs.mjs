// Downloads the club's public Google Calendar ICS feed into public/calendar-ics
// so that it is bundled as a static asset in the production build. GitHub
// Pages serves the built site as static files with no backend or dev-server
// proxy, so the app can't rely on Vite's `/calendar-ics` proxy (used only for
// `vite dev`) to reach Google Calendar at runtime. This script runs before
// every build (see the "prebuild" npm script) to fetch a fresh snapshot of
// the feed and write it to the same path the app already requests.
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CALENDAR_ICS_URL } from '../calendarSource.mjs'

const outputDir = fileURLToPath(new URL('../public', import.meta.url))
const outputPath = join(outputDir, 'calendar-ics')

const run = async () => {
  const response = await fetch(CALENDAR_ICS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar ICS feed: ${response.status} ${response.statusText}`)
  }

  const ics = await response.text()
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, ics, 'utf-8')
  console.log(`Wrote calendar ICS feed to ${outputPath}`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

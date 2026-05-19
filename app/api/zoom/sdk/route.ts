import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Serves the Zoom embedded SDK JS from node_modules.
// Using an API route avoids committing a 2.9 MB binary to git.
export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'node_modules/@zoom/meetingsdk/dist/zoomus-websdk-embedded.umd.min.js',
    )
    const content = fs.readFileSync(filePath)
    return new Response(content, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        // Cache aggressively — the file only changes when the package version changes
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'SDK file not found' }, { status: 500 })
  }
}

'use client'

import { useEffect } from 'react'

const HEARTBEAT_INTERVAL = 30_000 // 30 seconds

function getSessionId(): string {
  const key = 'webinar_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

async function sendHeartbeat(sessionId: string) {
  await fetch('/api/webinar/sala/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

export function WebinarRoomTracker() {
  useEffect(() => {
    const sessionId = getSessionId()

    // Track sala entry once per session
    const entryKey = 'webinar_sala_entry_sent'
    if (!sessionStorage.getItem(entryKey)) {
      fetch('/api/webinar/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SALA_ENTRY', sessionId }),
      }).catch(() => {})
      sessionStorage.setItem(entryKey, '1')
    }

    // Start heartbeat
    sendHeartbeat(sessionId).catch(() => {})
    const interval = setInterval(() => {
      sendHeartbeat(sessionId).catch(() => {})
    }, HEARTBEAT_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return null
}

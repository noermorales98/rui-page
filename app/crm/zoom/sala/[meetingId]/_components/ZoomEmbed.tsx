'use client'

// The Zoom Meeting SDK is incompatible with React 19 (references removed internals).
// We load it inside an iframe served by /api/zoom/room/[meetingId] — a plain HTML
// document completely isolated from the React tree.

interface Props {
  meetingId: number
}

export function ZoomEmbed({ meetingId }: Props) {
  return (
    <iframe
      src={`/api/zoom/room/${meetingId}`}
      className="h-full w-full border-none"
      // Permissions needed for camera, mic, screen share
      allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
      title="Zoom Meeting"
    />
  )
}

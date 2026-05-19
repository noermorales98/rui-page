'use client'

import { useEffect, useState } from 'react'

export function LiveCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/webinar/sala/count')
        const data = (await res.json()) as { count: number }
        setCount(data.count)
      } catch {
        // ignore
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${count != null && count > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
      />
      <span className="text-3xl font-bold tabular-nums text-[var(--color-on-surface)]">
        {count ?? '—'}
      </span>
    </div>
  )
}

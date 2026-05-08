import type { RegistrationStatus } from '@prisma/client'

interface Props {
  registrations: { status: RegistrationStatus }[]
}

export function WebinarStats({ registrations }: Props) {
  const total = registrations.length
  const attended = registrations.filter(
    (r) => r.status === 'ATTENDED' || r.status === 'PURCHASED',
  ).length
  const purchased = registrations.filter((r) => r.status === 'PURCHASED').length
  const attendancePct = total > 0 ? Math.round((attended / total) * 100) : 0

  return (
    <div className="flex flex-wrap gap-4">
      <div className="bg-[#f7f8fa] rounded-[24px] border border-white/60 p-5 text-center">
        <div className="text-2xl font-bold text-indigo-600">{total}</div>
        <div className="text-xs text-gray-500">Registrados</div>
      </div>
      <div className="bg-[#f7f8fa] rounded-[24px] border border-white/60 p-5 text-center">
        <div className="text-2xl font-bold text-yellow-600">{attended}</div>
        <div className="text-xs text-gray-500">Asistieron</div>
      </div>
      <div className="bg-[#f7f8fa] rounded-[24px] border border-white/60 p-5 text-center">
        <div className="text-2xl font-bold text-green-600">{purchased}</div>
        <div className="text-xs text-gray-500">Compraron</div>
      </div>
      <div className="bg-[#f7f8fa] rounded-[24px] border border-white/60 p-5 text-center">
        <div className="text-2xl font-bold text-gray-500">{attendancePct}%</div>
        <div className="text-xs text-gray-500">Asistencia</div>
      </div>
    </div>
  )
}

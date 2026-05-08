export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#080808]">Dashboard</h1>
        <p className="mt-1.5 text-sm text-[#8a8a8a]">Resumen general del CRM</p>
      </div>
      <div className="bg-[#f7f8fa] rounded-[28px] border border-white/60 shadow-[0_16px_45px_rgba(15,23,42,0.04)] p-12 text-center">
        <p className="text-[#8a8a8a] text-sm">Módulo en construcción</p>
      </div>
    </div>
  )
}

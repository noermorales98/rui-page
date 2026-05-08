'use client'

import { useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

type BaseProps = {
  name: string
  label: string
  required?: boolean
  placeholder?: string | null
}

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function dateToValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function buildMonthDays(cursor: Date) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const leadingEmpty = firstDay === 0 ? 6 : firstDay - 1

  return [
    ...Array.from({ length: leadingEmpty }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1)),
  ]
}

export function CustomDateInput({ name, label, required, placeholder }: BaseProps) {
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState<string>('')
  const days = useMemo(() => buildMonthDays(cursor), [cursor])

  function moveMonth(delta: number) {
    setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  return (
    <div>
      <input type="hidden" name={name} value={selected} required={required} />
      <div className="rounded-xl border border-[#f2f2f2] bg-white p-3">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label={`Mes anterior para ${label}`}
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <Calendar size={16} />
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label={`Mes siguiente para ${label}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-400">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) =>
            date ? (
              <button
                key={dateToValue(date)}
                type="button"
                onClick={() => setSelected(dateToValue(date))}
                className={`aspect-square rounded-lg text-sm ${
                  selected === dateToValue(date)
                    ? 'bg-indigo-600 font-semibold text-white'
                    : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                {date.getDate()}
              </button>
            ) : (
              <span key={`empty-${index}`} />
            ),
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{selected || placeholder || 'Sin fecha seleccionada'}</p>
    </div>
  )
}

export function CustomTimeInput({ name, label, required, placeholder }: BaseProps) {
  const [hour, setHour] = useState('09')
  const [minute, setMinute] = useState('00')
  const [selected, setSelected] = useState('')
  const hours = Array.from({ length: 24 }, (_, index) => pad(index))
  const minutes = ['00', '15', '30', '45']
  const value = selected || 'Selecciona hora'

  return (
    <div>
      <input type="hidden" name={name} value={selected} required={required} />
      <div className="rounded-xl border border-[#f2f2f2] bg-white p-3">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Clock size={16} />
          {value}
        </div>
        <div className="grid grid-cols-[1fr_72px] gap-3">
          <div className="grid max-h-40 grid-cols-4 gap-1 overflow-y-auto pr-1">
            {hours.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`${label} ${item} horas`}
                onClick={() => {
                  setHour(item)
                  setSelected(`${item}:${minute}`)
                }}
                className={`rounded-lg px-2 py-1.5 text-sm ${
                  item === hour ? 'bg-indigo-600 font-semibold text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="grid gap-1">
            {minutes.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={`${label} ${item} minutos`}
                onClick={() => {
                  setMinute(item)
                  setSelected(`${hour}:${item}`)
                }}
                className={`rounded-lg px-2 py-1.5 text-sm ${
                  item === minute ? 'bg-indigo-600 font-semibold text-white' : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{selected || placeholder || 'Sin hora seleccionada'}</p>
    </div>
  )
}

export function CustomDateTimeInput({ name, label, required, placeholder }: BaseProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const value = date && time ? `${date}T${time}` : ''

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} required={required} />
      <CustomDatePart label={label} onChange={setDate} />
      <CustomTimePart label={label} onChange={setTime} />
      <p className="text-xs text-gray-500">{value || placeholder || 'Sin fecha y hora seleccionadas'}</p>
    </div>
  )
}

function CustomDatePart({ label, onChange }: { label: string; onChange: (value: string) => void }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState('')
  const days = useMemo(() => buildMonthDays(cursor), [cursor])

  function selectDate(date: Date) {
    const value = dateToValue(date)
    setSelected(value)
    onChange(value)
  }

  return (
    <div className="rounded-xl border border-[#f2f2f2] bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label={`Mes anterior para ${label}`}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          aria-label={`Mes siguiente para ${label}`}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) =>
          date ? (
            <button
              key={dateToValue(date)}
              type="button"
              onClick={() => selectDate(date)}
              className={`aspect-square rounded-lg text-sm ${
                selected === dateToValue(date) ? 'bg-indigo-600 font-semibold text-white' : 'text-gray-700 hover:bg-indigo-50'
              }`}
            >
              {date.getDate()}
            </button>
          ) : (
            <span key={`empty-${index}`} />
          ),
        )}
      </div>
    </div>
  )
}

function CustomTimePart({ label, onChange }: { label: string; onChange: (value: string) => void }) {
  const [selected, setSelected] = useState('')
  const options = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']

  return (
    <div className="rounded-xl border border-[#f2f2f2] bg-white p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
        <Clock size={16} />
        {selected || 'Selecciona hora'}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setSelected(option)
              onChange(option)
            }}
            className={`rounded-lg px-2 py-1.5 text-sm ${
              selected === option ? 'bg-indigo-600 font-semibold text-white' : 'text-gray-700 hover:bg-indigo-50'
            }`}
            aria-label={`${label} ${option}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

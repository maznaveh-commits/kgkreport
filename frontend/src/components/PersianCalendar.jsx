import { useState } from 'react'
import jalaali from 'jalaali-js'

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const J_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']

function toJalaali(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function toGregorian(jy, jm, jd) {
  const g = jalaali.toGregorian(jy, jm, jd)
  return `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`
}

export default function PersianCalendar({ reports, onSelectDate, selectedDate }) {
  const today = toJalaali(new Date().toISOString().split('T')[0])
  const [currentJY, setCurrentJY] = useState(today.jy)
  const [currentJM, setCurrentJM] = useState(today.jm)

  const daysInMonth = jalaali.jalaaliMonthLength(currentJY, currentJM)
  const g = jalaali.toGregorian(currentJY, currentJM, 1)
  const firstWeekDay = (new Date(g.gy, g.gm-1, g.gd).getDay() + 1) % 7

  const reportMap = {}
  reports.forEach(r => { reportMap[r.report_date] = r.status })

  const prevMonth = () => {
    if (currentJM === 1) { setCurrentJY(y => y-1); setCurrentJM(12) }
    else setCurrentJM(m => m-1)
  }

  const nextMonth = () => {
    const todayJ = toJalaali(new Date().toISOString().split('T')[0])
    if (currentJY > todayJ.jy || (currentJY === todayJ.jy && currentJM >= todayJ.jm)) return
    if (currentJM === 12) { setCurrentJY(y => y+1); setCurrentJM(1) }
    else setCurrentJM(m => m+1)
  }

  const handleDayClick = (jd) => {
    const gDate = toGregorian(currentJY, currentJM, jd)
    if (gDate > new Date().toISOString().split('T')[0]) return
    onSelectDate(gDate)
  }

  const cells = []
  for (let i = 0; i < firstWeekDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayJ = toJalaali(new Date().toISOString().split('T')[0])
  const selectedJ = selectedDate ? toJalaali(selectedDate) : null

  return (
    <div className="bg-white rounded-xl shadow p-3 lg:p-4 w-full">
      {/* هدر */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg">&#8249;</button>
        <span className="font-bold text-gray-800 text-sm lg:text-base">
          {J_MONTHS[currentJM-1]} {currentJY}
        </span>
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 text-lg">&#8250;</button>
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* روزها */}
      <div className="grid grid-cols-7 gap-0.5 lg:gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />
          const gDate = toGregorian(currentJY, currentJM, day)
          const todayStr = new Date().toISOString().split('T')[0]
          const isFuture = gDate > todayStr
          const isToday = currentJY===todayJ.jy && currentJM===todayJ.jm && day===todayJ.jd
          const isSelected = selectedJ && currentJY===selectedJ.jy && currentJM===selectedJ.jm && day===selectedJ.jd
          const status = reportMap[gDate]

          let cls = 'hover:bg-gray-100 text-gray-700'
          if (isFuture) cls = 'opacity-25 cursor-not-allowed text-gray-400'
          else if (isSelected) cls = 'bg-blue-600 text-white'
          else if (status === 'approved') cls = 'bg-green-100 text-green-800 hover:bg-green-200'
          else if (status === 'submitted') cls = 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          else if (status === 'draft') cls = 'bg-orange-100 text-orange-800 hover:bg-orange-200'

          return (
            <button key={idx} onClick={() => !isFuture && handleDayClick(day)}
              className={`aspect-square flex items-center justify-center text-xs lg:text-sm rounded-lg transition-all relative ${cls}`}>
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* راهنما */}
      <div className="flex gap-2 mt-3 pt-2 border-t flex-wrap">
        {[
          ['bg-blue-100','ارسال شده'],
          ['bg-green-100','تایید شده'],
          ['bg-orange-100','پیش‌نویس'],
        ].map(([bg, label]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded ${bg}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

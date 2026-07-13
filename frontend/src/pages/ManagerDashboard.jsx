import { useState, useEffect } from 'react'
import api from '../api'
import Toast from '../components/Toast'
import PersianCalendar from '../components/PersianCalendar'

const statusBadge = (status) => {
  if (!status) return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">ثبت نشده</span>
  if (status === 'approved') return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ تایید شده</span>
  if (status === 'submitted') return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">📤 ارسال شده</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">✏️ پیش‌نویس</span>
}

export default function ManagerDashboard() {
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffReports, setStaffReports] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [todayDate] = useState(new Date().toISOString().split('T')[0])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list') // list | detail

  const notify = (m, isErr=false) => setToast({ message: m, type: isErr ? 'error' : 'success' })

  const fetchStaffList = async () => {
    try {
      const res = await api.get(`/reports/team/staff-list?report_date=${todayDate}`)
      setStaffList(res.data)
    } catch { notify('خطا در دریافت لیست پرسنل', true) }
  }

  useEffect(() => { fetchStaffList() }, [])

  const selectStaff = async (staff) => {
    setSelectedStaff(staff)
    setSelectedDate(null)
    setSelectedReport(null)
    setView('detail')
    try {
      const res = await api.get(`/reports/team/staff/${staff.id}`)
      setStaffReports(res.data)
    } catch { setStaffReports([]) }
  }

  const selectDate = (gDate) => {
    setSelectedDate(gDate)
    const found = staffReports.find(r => r.report_date === gDate)
    setSelectedReport(found || null)
  }

  const approveReport = async (reportId) => {
    if (!confirm('این گزارش تایید شود؟')) return
    setLoading(true)
    try {
      await api.patch(`/reports/${reportId}/approve`)
      notify('گزارش با موفقیت تایید شد ✓')
      const res = await api.get(`/reports/team/staff/${selectedStaff.id}`)
      setStaffReports(res.data)
      const found = res.data.find(r => r.report_date === selectedDate)
      setSelectedReport(found || null)
      fetchStaffList()
    } catch (e) { notify(e.response?.data?.detail || 'خطا', true) }
    finally { setLoading(false) }
  }

  const toJalali = (dateStr) => {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleDateString('fa-IR') } catch { return dateStr }
  }

  const todaySubmitted = staffList.filter(s => s.report_status === 'submitted').length
  const todayApproved = staffList.filter(s => s.report_status === 'approved').length
  const todayMissing = staffList.filter(s => !s.report_status).length

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 className="text-xl font-bold text-gray-800">داشبورد مدیریت</h2>

      {/* آمار امروز */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['👥', 'کل پرسنل', staffList.length, 'bg-blue-50 text-blue-700'],
          ['📤', 'ارسال شده', todaySubmitted, 'bg-yellow-50 text-yellow-700'],
          ['✓', 'تایید شده', todayApproved, 'bg-green-50 text-green-700'],
          ['⚠️', 'ثبت نشده', todayMissing, 'bg-red-50 text-red-700'],
        ].map(([icon, label, count, cls]) => (
          <div key={label} className={`rounded-xl p-4 ${cls}`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm">{label} — امروز</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* لیست پرسنل */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-700">پرسنل تحت نظر ({staffList.length})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {staffList.length === 0 && (
              <p className="text-sm text-gray-400 text-center p-6">هنوز پرسنلی تعریف نشده</p>
            )}
            {staffList.map(s => (
              <button key={s.id} onClick={() => selectStaff(s)}
                className={`w-full p-4 text-right hover:bg-gray-50 transition-colors ${
                  selectedStaff?.id === s.id ? 'bg-blue-50' : ''
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.full_name}</p>
                    <p className="text-xs text-gray-500">{s.username}</p>
                  </div>
                  {statusBadge(s.report_status)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* جزئیات پرسنل انتخاب شده */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedStaff ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
              <p className="text-4xl mb-3">👆</p>
              <p className="text-sm">یک نفر از لیست پرسنل انتخاب کنید</p>
            </div>
          ) : (
            <>
              {/* هدر پرسنل */}
              <div className="bg-white rounded-xl shadow p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{selectedStaff.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedStaff.username}</p>
                </div>
                <button onClick={() => { setView('list'); setSelectedStaff(null) }}
                  className="text-sm text-gray-500 hover:text-gray-700">
                  ← بازگشت
                </button>
              </div>

              {/* تقویم */}
              <PersianCalendar
                reports={staffReports}
                onSelectDate={selectDate}
                selectedDate={selectedDate} />

              {/* گزارش روز انتخاب شده */}
              {selectedDate && (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-gray-800">{toJalali(selectedDate)}</p>
                      {selectedReport && statusBadge(selectedReport.status)}
                    </div>
                    {selectedReport?.status === 'submitted' && (
                      <button onClick={() => approveReport(selectedReport.id)} disabled={loading}
                        className="text-sm px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        ✓ تایید گزارش
                      </button>
                    )}
                  </div>

                  {!selectedReport ? (
                    <div className="p-6 text-center text-gray-400 text-sm">گزارشی برای این روز ثبت نشده</div>
                  ) : selectedReport.items?.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">این گزارش اقدامی ندارد</div>
                  ) : (
                    <>
                      {selectedReport.delay_reason && (
                        <div className="mx-4 mt-3 p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                          دلیل تاخیر: {selectedReport.delay_reason}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-center text-xs text-gray-500 w-8">#</th>
                              <th className="px-3 py-2 text-right text-xs text-gray-500">شرح اقدام</th>
                              <th className="px-3 py-2 text-center text-xs text-gray-500 w-24">مدت (دقیقه)</th>
                              <th className="px-3 py-2 text-center text-xs text-gray-500 w-32">درصد تکمیل</th>
                              <th className="px-3 py-2 text-center text-xs text-gray-500 w-24">وضعیت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReport.items.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-3 py-3 text-center text-sm text-gray-400">{idx+1}</td>
                                <td className="px-3 py-3 text-sm text-gray-800">{item.action_description}</td>
                                <td className="px-3 py-3 text-center text-sm text-gray-700">{item.duration_minutes || 0}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${
                                        item.completion_percent >= 100 ? 'bg-green-500' :
                                        item.completion_percent >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                                      }`} style={{width:`${item.completion_percent||0}%`}} />
                                    </div>
                                    <span className="text-xs text-gray-600 w-8">{item.completion_percent||0}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    item.completion_percent >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {item.completion_percent >= 100 ? 'تکمیل' : 'جاری'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 border-t border-gray-200">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-xs text-gray-500">مجموع {selectedReport.items.length} اقدام</td>
                              <td className="px-3 py-2 text-center text-xs font-medium text-gray-700">
                                {selectedReport.items.reduce((s,i) => s+(i.duration_minutes||0), 0)} دقیقه
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

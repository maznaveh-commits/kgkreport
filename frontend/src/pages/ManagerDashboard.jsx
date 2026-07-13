import { useState, useEffect } from 'react'
import api from '../api'
import Toast from '../components/Toast'
import PersianCalendar from '../components/PersianCalendar'

export default function ManagerDashboard() {
  const [staffList, setStaffList] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [staffReports, setStaffReports] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [todayDate] = useState(new Date().toISOString().split('T')[0])
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('list')

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

      <h2 className="text-xl font-bold text-white">داشبورد مدیریت</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['👥', 'کل پرسنل', staffList.length, 'from-blue-500/20 to-blue-600/10 border-blue-500/20'],
          ['📤', 'ارسال شده', todaySubmitted, 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20'],
          ['✓', 'تایید شده', todayApproved, 'from-green-500/20 to-green-600/10 border-green-500/20'],
          ['⚠️', 'ثبت نشده', todayMissing, 'from-red-500/20 to-red-600/10 border-red-500/20'],
        ].map(([icon, label, count, gradient]) => (
          <div key={label} className={`stat-card bg-gradient-to-br ${gradient} border`}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{count}</div>
            <div className="text-sm text-slate-400">{label} — امروز</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-medium text-white">پرسنل تحت نظر ({staffList.length})</h3>
          </div>
          <div className="divide-y divide-white/5">
            {staffList.length === 0 && (
              <p className="text-sm text-slate-500 text-center p-6">هنوز پرسنلی تعریف نشده</p>
            )}
            {staffList.map(s => (
              <button key={s.id} onClick={() => selectStaff(s)}
                className={`w-full p-4 text-right hover:bg-white/5 transition-colors ${
                  selectedStaff?.id === s.id ? 'bg-white/10' : ''
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.username}</p>
                  </div>
                  {!s.report_status ? (
                    <span className="badge badge-gray">ثبت نشده</span>
                  ) : s.report_status === 'approved' ? (
                    <span className="badge badge-green">✓ تایید شده</span>
                  ) : s.report_status === 'submitted' ? (
                    <span className="badge badge-blue">📤 ارسال شده</span>
                  ) : (
                    <span className="badge badge-orange">✏️ پیش‌نویس</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!selectedStaff ? (
            <div className="glass-card p-8 text-center">
              <p className="text-4xl mb-3">👆</p>
              <p className="text-sm text-slate-400">یک نفر از لیست پرسنل انتخاب کنید</p>
            </div>
          ) : (
            <>
              <div className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{selectedStaff.full_name}</p>
                  <p className="text-xs text-slate-500">{selectedStaff.username}</p>
                </div>
                <button onClick={() => { setView('list'); setSelectedStaff(null) }}
                  className="glass-btn-secondary text-sm px-3 py-1.5 rounded-xl">
                  ← بازگشت
                </button>
              </div>

              <PersianCalendar
                reports={staffReports}
                onSelectDate={selectDate}
                selectedDate={selectedDate} />

              {selectedDate && (
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-white">{toJalali(selectedDate)}</p>
                      {selectedReport && (
                        !selectedReport.status ? (
                          <span className="badge badge-gray">ثبت نشده</span>
                        ) : selectedReport.status === 'approved' ? (
                          <span className="badge badge-green">✓ تایید شده</span>
                        ) : selectedReport.status === 'submitted' ? (
                          <span className="badge badge-blue">📤 ارسال شده</span>
                        ) : (
                          <span className="badge badge-orange">✏️ پیش‌نویس</span>
                        )
                      )}
                    </div>
                    {selectedReport?.status === 'submitted' && (
                      <button onClick={() => approveReport(selectedReport.id)} disabled={loading}
                        className="glass-btn-success text-sm px-4 py-1.5 rounded-xl disabled:opacity-50">
                        ✓ تایید گزارش
                      </button>
                    )}
                  </div>

                  {!selectedReport ? (
                    <div className="p-6 text-center text-slate-500 text-sm">گزارشی برای این روز ثبت نشده</div>
                  ) : selectedReport.items?.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">این گزارش اقدامی ندارد</div>
                  ) : (
                    <>
                      {selectedReport.delay_reason && (
                        <div className="mx-4 mt-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-sm text-orange-300">
                          دلیل تاخیر: {selectedReport.delay_reason}
                        </div>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                              <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-8">#</th>
                              <th className="px-3 py-2.5 text-right text-xs text-slate-400">شرح اقدام</th>
                              <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-24">مدت</th>
                              <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-32">تکمیل</th>
                              <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-24">وضعیت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedReport.items.map((item, idx) => (
                              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="px-3 py-3 text-center text-sm text-slate-500">{idx+1}</td>
                                <td className="px-3 py-3 text-sm text-slate-200">{item.action_description}</td>
                                <td className="px-3 py-3 text-center text-sm text-slate-300">{item.duration_minutes || 0}</td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-white/5 rounded-full h-1.5">
                                      <div className={`h-1.5 rounded-full ${
                                        item.completion_percent >= 100 ? 'bg-green-500' :
                                        item.completion_percent >= 50 ? 'bg-blue-500' : 'bg-orange-400'
                                      }`} style={{width:`${item.completion_percent||0}%`}} />
                                    </div>
                                    <span className="text-xs text-slate-400 w-8">{item.completion_percent||0}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`badge ${
                                    item.completion_percent >= 100 ? 'badge-green' : 'badge-orange'
                                  }`}>
                                    {item.completion_percent >= 100 ? 'تکمیل' : 'جاری'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-white/5 border-t border-white/10">
                            <tr>
                              <td colSpan={2} className="px-3 py-2 text-xs text-slate-500">مجموع {selectedReport.items.length} اقدام</td>
                              <td className="px-3 py-2 text-center text-xs font-medium text-slate-300">
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

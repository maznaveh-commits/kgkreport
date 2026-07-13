import { useState, useEffect, Fragment } from 'react'
import api from '../api'
import Toast from '../components/Toast'

const statusBadge = (status) => {
  if (status === 'approved') return <span className="badge badge-green">تایید</span>
  if (status === 'submitted') return <span className="badge badge-blue">ارسال</span>
  if (status === 'draft') return <span className="badge badge-orange">پیش‌نویس</span>
  return <span className="badge badge-gray">ثبت نشده</span>
}

const toJalali = (dateStr) => {
  if (!dateStr) return ''
  try { return new Date(dateStr).toLocaleDateString('fa-IR') } catch { return dateStr }
}

export default function CompanyDashboard() {
  const [managers, setManagers] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [filters, setFilters] = useState({ from_date: '', to_date: '', manager_id: '', status: '' })
  const [stats, setStats] = useState({ total: 0, approved: 0, submitted: 0, draft: 0 })

  const notify = (m, isErr=false) => setToast({ message: m, type: isErr ? 'error' : 'success' })

  useEffect(() => {
    api.get('/company/managers').then(r => setManagers(r.data)).catch(() => {})
    fetchReport()
  }, [])

  useEffect(() => {
    setStats({
      total: rows.length,
      approved: rows.filter(r => r.report_status === 'approved').length,
      submitted: rows.filter(r => r.report_status === 'submitted').length,
      draft: rows.filter(r => r.report_status === 'draft').length,
    })
  }, [rows])

  const fetchReport = async (f) => {
    setLoading(true)
    try {
      const fil = f || filters
      const params = new URLSearchParams()
      if (fil.from_date) params.append('from_date', fil.from_date)
      if (fil.to_date) params.append('to_date', fil.to_date)
      if (fil.manager_id) params.append('manager_id', fil.manager_id)
      if (fil.status) params.append('status', fil.status)
      const res = await api.get(`/company/unified-report?${params}`)
      setRows(res.data)
    } catch { notify('خطا در دریافت گزارش', true) }
    finally { setLoading(false) }
  }

  const resetFilters = () => {
    const empty = { from_date: '', to_date: '', manager_id: '', status: '' }
    setFilters(empty)
    fetchReport(empty)
  }

  const groupedByManager = rows.reduce((acc, row) => {
    if (!acc[row.manager_name]) acc[row.manager_name] = []
    acc[row.manager_name].push(row)
    return acc
  }, {})

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 className="text-lg lg:text-xl font-bold text-white">داشبورد مدیر شرکت</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['📋', 'کل اقدامات', stats.total, 'from-blue-500/20 to-blue-600/10 border-blue-500/20'],
          ['✓', 'تایید شده', stats.approved, 'from-green-500/20 to-green-600/10 border-green-500/20'],
          ['📤', 'ارسال شده', stats.submitted, 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20'],
          ['✏️', 'پیش‌نویس', stats.draft, 'from-orange-500/20 to-orange-600/10 border-orange-500/20'],
        ].map(([icon, label, count, gradient]) => (
          <div key={label} className={`stat-card bg-gradient-to-br ${gradient} border`}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-xl lg:text-2xl font-bold text-white">{count}</div>
            <div className="text-xs lg:text-sm text-slate-400">{label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-4">
        <h3 className="font-medium text-white mb-3 border-b border-white/10 pb-3 text-sm">فیلتر گزارش</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">از تاریخ</label>
            <input type="date" value={filters.from_date}
              onChange={e => setFilters({...filters, from_date: e.target.value})}
              className="glass-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">تا تاریخ</label>
            <input type="date" value={filters.to_date}
              onChange={e => setFilters({...filters, to_date: e.target.value})}
              className="glass-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">مدیر واحد</label>
            <select value={filters.manager_id}
              onChange={e => setFilters({...filters, manager_id: e.target.value})}
              className="glass-input w-full px-3 py-2 text-sm">
              <option value="" className="bg-slate-800">همه مدیران</option>
              {managers.map(m => <option key={m.id} value={m.id} className="bg-slate-800">{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">وضعیت</label>
            <select value={filters.status}
              onChange={e => setFilters({...filters, status: e.target.value})}
              className="glass-input w-full px-3 py-2 text-sm">
              <option value="" className="bg-slate-800">همه</option>
              <option value="approved" className="bg-slate-800">تایید شده</option>
              <option value="submitted" className="bg-slate-800">ارسال شده</option>
              <option value="draft" className="bg-slate-800">پیش‌نویس</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-3">
          <button onClick={resetFilters}
            className="glass-btn-secondary px-4 py-2 text-sm rounded-xl">
            پاک کردن
          </button>
          <button onClick={() => fetchReport()} disabled={loading}
            className="glass-btn px-4 py-2 text-sm disabled:opacity-50 rounded-xl">
            {loading ? 'بارگذاری...' : 'اعمال فیلتر'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center text-slate-500 text-sm">در حال بارگذاری...</div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-slate-400">گزارشی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByManager).map(([managerName, managerRows]) => {
            const mgrRows = managerRows.filter(r => r.person_role === 'manager')
            const staffGroups = managerRows
              .filter(r => r.person_role === 'staff')
              .reduce((acc, row) => {
                if (!acc[row.person_name]) acc[row.person_name] = []
                acc[row.person_name].push(row)
                return acc
              }, {})

            return (
              <div key={managerName} className="glass-card overflow-hidden">
                <div className="bg-gradient-to-l from-blue-600/30 to-blue-500/10 px-4 py-3 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">👤 {managerName}</span>
                    <span className="badge badge-blue">مدیر واحد</span>
                  </div>
                  <span className="text-xs text-slate-400">{managerRows.length} اقدام</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-3 py-2.5 text-right text-xs text-slate-400 w-24">تاریخ</th>
                        <th className="px-3 py-2.5 text-right text-xs text-slate-400 w-28">نام</th>
                        <th className="px-3 py-2.5 text-right text-xs text-slate-400">شرح اقدام</th>
                        <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-20">مدت</th>
                        <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-24">تکمیل</th>
                        <th className="px-3 py-2.5 text-center text-xs text-slate-400 w-24">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mgrRows.map((row, idx) => (
                        <tr key={`m-${idx}`} className="border-b border-white/5 bg-blue-500/5 hover:bg-blue-500/10">
                          <td className="px-3 py-2.5 text-xs text-slate-400">{toJalali(row.report_date)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-blue-300">{row.person_name}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-300">{row.action_description}</td>
                          <td className="px-3 py-2.5 text-center text-xs text-slate-400">{row.duration_minutes}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 bg-white/5 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${row.completion_percent >= 100 ? 'bg-green-500' : 'bg-blue-400'}`}
                                  style={{width:`${row.completion_percent}%`}} />
                              </div>
                              <span className="text-xs text-slate-500 w-7">{row.completion_percent}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center">{statusBadge(row.report_status)}</td>
                        </tr>
                      ))}

                      {Object.entries(staffGroups).map(([staffName, staffItems]) => (
                        <Fragment key={`group-${staffName}`}>
                          <tr className="bg-white/5 border-b border-white/10">
                            <td colSpan={6} className="px-3 py-2">
                              <span className="text-xs font-medium text-slate-300">👥 {staffName}</span>
                              <span className="text-xs text-slate-500 mr-2">({staffItems.length} اقدام)</span>
                            </td>
                          </tr>
                          {staffItems.map((row, idx) => (
                            <tr key={`s-${staffName}-${idx}`} className="border-b border-white/5 hover:bg-white/5">
                              <td className="px-3 py-2.5 text-xs text-slate-400">{toJalali(row.report_date)}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-300">{row.person_name}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-300">{row.action_description}</td>
                              <td className="px-3 py-2.5 text-center text-xs text-slate-400">{row.duration_minutes}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 bg-white/5 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${row.completion_percent >= 100 ? 'bg-green-500' : row.completion_percent >= 50 ? 'bg-blue-400' : 'bg-orange-400'}`}
                                      style={{width:`${row.completion_percent}%`}} />
                                  </div>
                                  <span className="text-xs text-slate-500 w-7">{row.completion_percent}%</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">{statusBadge(row.report_status)}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                    <tfoot className="bg-white/5 border-t border-white/10">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-xs text-slate-500">مجموع: {managerRows.length} اقدام</td>
                        <td className="px-3 py-2 text-center text-xs font-medium text-slate-300">
                          {managerRows.reduce((s,r) => s+(r.duration_minutes||0), 0)} دقیقه
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

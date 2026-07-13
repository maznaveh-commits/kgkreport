import { useState, useEffect } from 'react'
import api from '../api'
import Toast from '../components/Toast'
import PersianCalendar from '../components/PersianCalendar'
import ReportItemRow from '../components/ReportItemRow'

export default function SubmitReport() {
  const [managers, setManagers] = useState([])
  const [selectedManager, setSelectedManager] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [allReports, setAllReports] = useState([])
  const [currentReport, setCurrentReport] = useState(null)
  const [items, setItems] = useState([])
  const [pendingItems, setPendingItems] = useState([])
  const [delayReason, setDelayReason] = useState('')
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPending, setShowPending] = useState(false)

  const notify = (m, isErr=false) => setToast({ message: m, type: isErr ? 'error' : 'success' })

  useEffect(() => {
    api.get('/users/my-managers').then(r => setManagers(r.data))
  }, [])

  const fetchReports = async (managerId) => {
    const [reports, pending] = await Promise.all([
      api.get('/reports/my'),
      api.get(`/reports/pending-items?manager_id=${managerId}`)
    ])
    setAllReports(reports.data.filter(r => r.manager_id === managerId))
    setPendingItems(pending.data)
  }

  const selectManager = async (manager) => {
    setSelectedManager(manager)
    setSelectedDate(null)
    setCurrentReport(null)
    setItems([])
    try { await fetchReports(manager.id) }
    catch { setAllReports([]); setPendingItems([]) }
  }

  const selectDate = (gDate) => {
    setSelectedDate(gDate)
    const found = allReports.find(r => r.report_date === gDate)
    if (found) {
      setCurrentReport(found)
      setItems(found.items.map(i => ({ ...i })))
      setDelayReason(found.delay_reason || '')
    } else {
      setCurrentReport(null)
      setItems([])
      setDelayReason('')
    }
  }

  const isToday = selectedDate === new Date().toISOString().split('T')[0]
  const isApproved = currentReport?.status === 'approved'
  const isSubmitted = currentReport?.status === 'submitted'
  const isDraft = !currentReport || currentReport?.status === 'draft'

  const addNewItem = () => setItems(prev => [...prev, {
    id: null, action_description: '', duration_minutes: 0,
    completion_percent: 0, item_status: 'in_progress', task_id: null,
  }])

  const addPendingItem = (p) => {
    if (items.find(i => i.action_description === p.action_description)) return
    setItems(prev => [...prev, {
      id: null, action_description: p.action_description,
      duration_minutes: p.duration_minutes, completion_percent: p.completion_percent,
      item_status: p.completion_percent >= 100 ? 'completed' : 'in_progress', task_id: p.task_id || null,
    }])
  }

  const buildPayload = (overrideItems) => ({
    manager_id: selectedManager.id,
    report_date: selectedDate,
    delay_reason: !isToday ? delayReason : null,
    items: (overrideItems || items).map(({ action_description, duration_minutes, completion_percent, item_status, task_id }) =>
      ({ action_description, duration_minutes, completion_percent, item_status, task_id }))
  })

  const saveItem = async (idx, formData) => {
    if (!formData.action_description.trim()) { notify('شرح اقدام را وارد کنید', true); return }
    if (!isToday && !delayReason) { notify('دلیل تاخیر را وارد کنید', true); return }
    setLoading(true)
    try {
      const updatedItems = items.map((item, i) => i === idx ? { ...item, ...formData } : item)
      let saved
      if (currentReport) {
        const res = await api.put(`/reports/${currentReport.id}`, buildPayload(updatedItems))
        saved = res.data
      } else {
        const res = await api.post('/reports/', buildPayload(updatedItems))
        saved = res.data
      }
      notify('اقدام ذخیره شد ✓')
      setCurrentReport(saved)
      setItems(saved.items.map(i => ({ ...i })))
      await fetchReports(selectedManager.id)
    } catch (e) { notify(e.response?.data?.detail || 'خطا', true) }
    finally { setLoading(false) }
  }

  const deleteItem = async (idx) => {
    if (!confirm('حذف شود؟')) return
    const updatedItems = items.filter((_, i) => i !== idx)
    setLoading(true)
    try {
      if (currentReport) {
        const res = await api.put(`/reports/${currentReport.id}`, buildPayload(updatedItems))
        setCurrentReport(res.data)
        setItems(res.data.items.map(i => ({ ...i })))
        await fetchReports(selectedManager.id)
      } else {
        setItems(updatedItems)
      }
      notify('اقدام حذف شد')
    } catch { notify('خطا در حذف', true) }
    finally { setLoading(false) }
  }

  const submitReport = async () => {
    if (items.length === 0) { notify('حداقل یک اقدام ثبت کنید', true); return }
    if (!confirm('گزارش نهایی شود و برای مدیر ارسال شود؟')) return
    setLoading(true)
    try {
      let reportId = currentReport?.id
      if (!reportId) {
        const res = await api.post('/reports/', buildPayload())
        reportId = res.data.id
      }
      await api.patch(`/reports/${reportId}/submit`)
      notify('گزارش با موفقیت ارسال شد ✓')
      await fetchReports(selectedManager.id)
      const reports = await api.get('/reports/my')
      const found = reports.data.find(r => r.id === reportId)
      if (found) { setCurrentReport(found); setItems(found.items.map(i=>({...i}))) }
    } catch (e) { notify(e.response?.data?.detail || 'خطا', true) }
    finally { setLoading(false) }
  }

  const revertReport = async () => {
    if (!confirm('گزارش به پیش‌نویس برگردد؟')) return
    setLoading(true)
    try {
      await api.patch(`/reports/${currentReport.id}/revert`)
      notify('گزارش به پیش‌نویس برگشت')
      await fetchReports(selectedManager.id)
      const reports = await api.get('/reports/my')
      const found = reports.data.find(r => r.id === currentReport.id)
      if (found) { setCurrentReport(found); setItems(found.items.map(i=>({...i}))) }
    } catch (e) { notify(e.response?.data?.detail || 'خطا', true) }
    finally { setLoading(false) }
  }

  const toJalali = (dateStr) => {
    if (!dateStr) return ''
    try { return new Date(dateStr).toLocaleDateString('fa-IR') } catch { return dateStr }
  }

  const statusBadge = (status) => {
    if (status === 'approved') return <span className="badge badge-green">✓ تایید شده</span>
    if (status === 'submitted') return <span className="badge badge-blue">📤 ارسال شده</span>
    return <span className="badge badge-orange">✏️ پیش‌نویس</span>
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 className="text-lg lg:text-xl font-bold text-white">گزارش کار روزانه</h2>

      <div className="glass-card p-4">
        <h3 className="font-medium text-white mb-3 border-b border-white/10 pb-3 text-sm">انتخاب مدیر / واحد</h3>
        {managers.length === 0 && <p className="text-sm text-slate-500">هنوز به هیچ مدیری متصل نشده‌اید.</p>}
        <div className="flex gap-2 flex-wrap">
          {managers.map(m => (
            <button key={m.id} onClick={() => selectManager(m)}
              className={`px-4 py-2.5 rounded-xl text-sm transition-all ${
                selectedManager?.id === m.id
                  ? 'glass-btn font-medium'
                  : 'glass-btn-secondary'
              }`}>
              {m.full_name}
            </button>
          ))}
        </div>
      </div>

      {selectedManager && (
        <div className="space-y-4">
          <PersianCalendar reports={allReports} onSelectDate={selectDate} selectedDate={selectedDate} />

          {!selectedDate ? (
            <div className="glass-card p-8 text-center">
              <p className="text-3xl mb-2">📅</p>
              <p className="text-sm text-slate-400">یک روز از تقویم انتخاب کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="glass-card p-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-bold text-white">{toJalali(selectedDate)}</p>
                    {currentReport && <div className="mt-2">{statusBadge(currentReport.status)}</div>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isDraft && pendingItems.length > 0 && (
                      <button onClick={() => setShowPending(p => !p)}
                        className="glass-btn-secondary text-xs px-3 py-1.5 rounded-xl">
                        ناتمام ({pendingItems.length})
                      </button>
                    )}
                    {isDraft && (
                      <button onClick={addNewItem}
                        className="glass-btn text-xs px-3 py-1.5 rounded-xl">
                        + اقدام
                      </button>
                    )}
                    {isDraft && items.length > 0 && (
                      <button onClick={submitReport} disabled={loading}
                        className="glass-btn-success text-xs px-3 py-1.5 rounded-xl disabled:opacity-50">
                        ✓ پایان روز
                      </button>
                    )}
                    {isSubmitted && (
                      <button onClick={revertReport} disabled={loading}
                        className="glass-btn-secondary text-xs px-3 py-1.5 rounded-xl disabled:opacity-50">
                        ↩ پیش‌نویس
                      </button>
                    )}
                  </div>
                </div>
                {isSubmitted && <p className="text-xs text-blue-400 mt-2">در انتظار تایید مدیر</p>}
                {isApproved && <p className="text-xs text-green-400 mt-2">تایید شده — قابل ویرایش نیست</p>}
              </div>

              {!isToday && isDraft && (
                <div className="glass-card p-4">
                  <label className="block text-sm text-orange-300 font-medium mb-2">دلیل تاخیر <span className="text-red-400">*</span></label>
                  <input type="text" value={delayReason} onChange={e => setDelayReason(e.target.value)}
                    placeholder="دلیل ثبت دیرهنگام را بنویسید"
                    className="glass-input w-full px-3 py-2.5 text-sm" />
                </div>
              )}

              {showPending && (
                <div className="glass-card p-4">
                  <h4 className="text-sm font-medium text-white mb-3">اقدامات ناتمام قبلی</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingItems.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{p.action_description}</p>
                          <p className="text-xs text-slate-500">{p.completion_percent}% | {toJalali(p.report_date)}</p>
                        </div>
                        <button onClick={() => { addPendingItem(p); setShowPending(false) }}
                          disabled={!!items.find(i => i.action_description === p.action_description)}
                          className="glass-btn text-xs px-2 py-1 rounded-xl disabled:opacity-40 shrink-0">
                          افزودن
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {items.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <p className="text-sm text-slate-400">اقدامی ثبت نشده</p>
                    {isDraft && (
                      <button onClick={addNewItem} className="mt-3 glass-btn text-xs px-4 py-2 rounded-xl">
                        + افزودن اقدام
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {items.map((item, idx) => (
                      <ReportItemRow
                        key={item.id || `new-${idx}`}
                        item={item} index={idx}
                        disabled={!isDraft}
                        onSave={(formData) => saveItem(idx, formData)}
                        onDelete={() => deleteItem(idx)} />
                    ))}
                    {isDraft && (
                      <div className="flex items-center justify-between glass-card p-3">
                        <span className="text-sm text-slate-400">
                          مجموع: {items.reduce((s,i) => s+(i.duration_minutes||0), 0)} دقیقه
                        </span>
                        <button onClick={addNewItem}
                          className="glass-btn-secondary text-sm px-3 py-1.5 rounded-xl">
                          + اقدام جدید
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

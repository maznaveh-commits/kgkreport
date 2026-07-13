import { useState } from 'react'
import api from '../api'
import { roleLabels } from '../utils/roles'

export default function RelationsTab({ users, relations, onRefresh, notify }) {
  const [relForm, setRelForm] = useState({ manager_id: '', staff_id: '' })

  const selectedManager = users.find(u => u.id === relForm.manager_id)

  const getSubordinates = () => {
    if (!selectedManager) return []
    if (selectedManager.role === 'company_manager') return users.filter(u => u.role === 'manager')
    if (selectedManager.role === 'manager') return users.filter(u => u.role === 'staff')
    return []
  }

  const managers = users.filter(u => ['manager', 'company_manager'].includes(u.role))

  const assignStaff = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/users/${relForm.manager_id}/staff/${relForm.staff_id}`)
      notify('رابطه تعریف شد ✓')
      setRelForm({ manager_id: '', staff_id: '' })
      onRefresh()
    } catch (e) { notify(e.response?.data?.detail || 'خطا', true) }
  }

  const removeRelation = async (mid, sid) => {
    try { await api.delete(`/users/${mid}/staff/${sid}`); onRefresh() }
    catch { notify('خطا', true) }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6">
        <h3 className="font-medium text-white mb-4 border-b border-white/10 pb-3">تعریف رابطه</h3>
        <form onSubmit={assignStaff} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">مدیر</label>
            <select required value={relForm.manager_id}
              onChange={e => setRelForm({ manager_id: e.target.value, staff_id: '' })}
              className="glass-input w-full px-3 py-2.5 text-sm">
              <option value="" className="bg-slate-800">انتخاب کنید...</option>
              {managers.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-800">{m.full_name} ({roleLabels[m.role]})</option>
              ))}
            </select>
          </div>
          {selectedManager && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              {selectedManager.role === 'company_manager'
                ? '✓ مدیر شرکت — فقط مدیران واحد قابل انتخاب هستند'
                : '✓ مدیر واحد — فقط پرسنل قابل انتخاب هستند'}
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              {selectedManager?.role === 'company_manager' ? 'مدیر واحد' : 'پرسنل'}
            </label>
            <select required value={relForm.staff_id}
              onChange={e => setRelForm({...relForm, staff_id: e.target.value})}
              disabled={!relForm.manager_id}
              className="glass-input w-full px-3 py-2.5 text-sm disabled:opacity-50">
              <option value="" className="bg-slate-800">
                {!relForm.manager_id ? 'ابتدا مدیر را انتخاب کنید' : 'انتخاب کنید...'}
              </option>
              {getSubordinates().map(s => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.full_name} {s.department_name ? `(${s.department_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="glass-btn-success w-full py-2.5 text-sm">
            تعریف رابطه
          </button>
        </form>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-medium text-white mb-4 border-b border-white/10 pb-3">روابط تعریف‌شده ({relations.length})</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {relations.length === 0 && <p className="text-sm text-slate-500 text-center py-4">هنوز رابطه‌ای تعریف نشده</p>}
          {relations.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
              <div className="text-sm">
                <span className={`font-medium ${r.manager_role === 'company_manager' ? 'text-blue-300' : 'text-green-300'}`}>
                  {r.manager_name}
                </span>
                <span className="text-slate-500 mx-1 text-xs">({roleLabels[r.manager_role]})</span>
                <span className="text-slate-600 mx-2">←</span>
                <span className="text-slate-300">{r.staff_name}</span>
                <span className="text-slate-500 mx-1 text-xs">({roleLabels[r.staff_role]})</span>
              </div>
              <button onClick={() => removeRelation(r.manager_id, r.staff_id)}
                className="glass-btn-danger text-xs px-2 py-1">حذف</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

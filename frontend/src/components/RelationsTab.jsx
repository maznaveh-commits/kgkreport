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
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">تعریف رابطه</h3>
        <form onSubmit={assignStaff} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">مدیر</label>
            <select required value={relForm.manager_id}
              onChange={e => setRelForm({ manager_id: e.target.value, staff_id: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">انتخاب کنید...</option>
              {managers.map(m => (
                <option key={m.id} value={m.id}>{m.full_name} ({roleLabels[m.role]})</option>
              ))}
            </select>
          </div>
          {selectedManager && (
            <div className="p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
              {selectedManager.role === 'company_manager'
                ? '✓ مدیر شرکت — فقط مدیران واحد قابل انتخاب هستند'
                : '✓ مدیر واحد — فقط پرسنل قابل انتخاب هستند'}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {selectedManager?.role === 'company_manager' ? 'مدیر واحد' : 'پرسنل'}
            </label>
            <select required value={relForm.staff_id}
              onChange={e => setRelForm({...relForm, staff_id: e.target.value})}
              disabled={!relForm.manager_id}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50">
              <option value="">
                {!relForm.manager_id ? 'ابتدا مدیر را انتخاب کنید' : 'انتخاب کنید...'}
              </option>
              {getSubordinates().map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} {s.department_name ? `(${s.department_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button type="submit"
            className="w-full bg-green-600 text-white rounded-lg py-2 text-sm hover:bg-green-700">
            تعریف رابطه
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">روابط تعریف‌شده ({relations.length})</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {relations.length === 0 && <p className="text-sm text-gray-400 text-center py-4">هنوز رابطه‌ای تعریف نشده</p>}
          {relations.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className={`font-medium ${r.manager_role === 'company_manager' ? 'text-blue-700' : 'text-green-700'}`}>
                  {r.manager_name}
                </span>
                <span className="text-gray-400 mx-1 text-xs">({roleLabels[r.manager_role]})</span>
                <span className="text-gray-400 mx-2">←</span>
                <span className="text-gray-700">{r.staff_name}</span>
                <span className="text-gray-400 mx-1 text-xs">({roleLabels[r.staff_role]})</span>
              </div>
              <button onClick={() => removeRelation(r.manager_id, r.staff_id)}
                className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

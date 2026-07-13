import { useState } from 'react'

export default function ReportItemRow({ item, index, onSave, onDelete, disabled }) {
  const [form, setForm] = useState({
    action_description: item?.action_description || '',
    duration_minutes: item?.duration_minutes || 0,
    completion_percent: item?.completion_percent || 0,
    item_status: item?.item_status || 'in_progress',
    task_id: item?.task_id || null,
  })
  const [changed, setChanged] = useState(false)

  const update = (field, value) => {
    const updated = { ...form, [field]: field === 'duration_minutes' || field === 'completion_percent' ? parseInt(value)||0 : value }
    if (field === 'completion_percent') updated.item_status = parseInt(value) >= 100 ? 'completed' : 'in_progress'
    setForm(updated)
    setChanged(true)
  }

  return (
    <div className="border border-gray-100 rounded-xl p-3 lg:p-4 bg-gray-50 space-y-3">
      {/* هدر سطر */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
          اقدام {index + 1}
        </span>
        <div className="flex gap-2">
          {!disabled && changed && (
            <button onClick={() => { onSave(form); setChanged(false) }}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ذخیره
            </button>
          )}
          {!disabled && (
            <button onClick={onDelete}
              className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
              حذف
            </button>
          )}
        </div>
      </div>

      {/* شرح اقدام */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">شرح اقدام</label>
        <textarea
          value={form.action_description}
          onChange={e => update('action_description', e.target.value)}
          disabled={disabled}
          rows={form.action_description.length > 80 ? 3 : 2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-white disabled:text-gray-600"
          placeholder="شرح اقدام انجام شده..." />
      </div>

      {/* مدت و درصد */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">مدت (دقیقه)</label>
          <input type="number" min="0" value={form.duration_minutes}
            onChange={e => update('duration_minutes', e.target.value)}
            disabled={disabled}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">تکمیل: {form.completion_percent}%</label>
          <input type="range" min="0" max="100" step="5" value={form.completion_percent}
            onChange={e => update('completion_percent', e.target.value)}
            disabled={disabled}
            className="w-full mt-2" />
        </div>
      </div>

      {/* نوار پیشرفت */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${
            form.completion_percent >= 100 ? 'bg-green-500' :
            form.completion_percent >= 50 ? 'bg-blue-500' : 'bg-orange-400'
          }`} style={{width:`${form.completion_percent}%`}} />
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
          form.completion_percent >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {form.completion_percent >= 100 ? 'تکمیل' : 'جاری'}
        </span>
      </div>
    </div>
  )
}

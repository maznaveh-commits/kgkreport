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
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="badge badge-blue">
          اقدام {index + 1}
        </span>
        <div className="flex gap-2">
          {!disabled && changed && (
            <button onClick={() => { onSave(form); setChanged(false) }}
              className="glass-btn text-xs px-3 py-1.5">
              ذخیره
            </button>
          )}
          {!disabled && (
            <button onClick={onDelete}
              className="glass-btn-danger text-xs px-2 py-1.5">
              حذف
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1.5">شرح اقدام</label>
        <textarea
          value={form.action_description}
          onChange={e => update('action_description', e.target.value)}
          disabled={disabled}
          rows={form.action_description.length > 80 ? 3 : 2}
          className="glass-input w-full px-3 py-2 text-sm resize-none disabled:opacity-60"
          placeholder="شرح اقدام انجام شده..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">مدت (دقیقه)</label>
          <input type="number" min="0" value={form.duration_minutes}
            onChange={e => update('duration_minutes', e.target.value)}
            disabled={disabled}
            className="glass-input w-full px-3 py-2 text-sm text-center disabled:opacity-60" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">تکمیل: {form.completion_percent}%</label>
          <input type="range" min="0" max="100" step="5" value={form.completion_percent}
            onChange={e => update('completion_percent', e.target.value)}
            disabled={disabled}
            className="w-full mt-2 accent-blue-500" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white/5 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${
            form.completion_percent >= 100 ? 'bg-green-500' :
            form.completion_percent >= 50 ? 'bg-blue-500' : 'bg-orange-400'
          }`} style={{width:`${form.completion_percent}%`}} />
        </div>
        <span className={`badge whitespace-nowrap ${
          form.completion_percent >= 100 ? 'badge-green' : 'badge-orange'
        }`}>
          {form.completion_percent >= 100 ? 'تکمیل' : 'جاری'}
        </span>
      </div>
    </div>
  )
}

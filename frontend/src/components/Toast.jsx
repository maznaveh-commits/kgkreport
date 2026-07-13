import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-white text-sm font-medium flex items-center gap-2 backdrop-blur-xl border transition-all ${
      type === 'success'
        ? 'bg-green-500/20 border-green-500/30'
        : 'bg-red-500/20 border-red-500/30'
    }`}>
      <span>{type === 'success' ? '✓' : '✗'}</span>
      {message}
    </div>
  )
}

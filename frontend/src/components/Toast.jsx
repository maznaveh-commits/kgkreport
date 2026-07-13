import { useEffect } from 'react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all ${
      type === 'success' ? 'bg-green-600' : 'bg-red-500'
    }`}>
      <span>{type === 'success' ? '✓' : '✗'}</span>
      {message}
    </div>
  )
}

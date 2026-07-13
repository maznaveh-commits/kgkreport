import { useState } from 'react'
import { useAuth } from '../AuthContext'
import api from '../api'
import { roleLabels } from '../utils/roles'

export default function Profile() {
  const { user, login } = useAuth()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' })
  const [msg, setMsg] = useState({ profile: '', password: '' })
  const [err, setErr] = useState({ profile: '', password: '' })

  const updateProfile = async (e) => {
    e.preventDefault()
    setMsg({ ...msg, profile: '' })
    setErr({ ...err, profile: '' })
    try {
      await api.patch('/profile/', { full_name: fullName })
      login({ ...user, full_name: fullName }, localStorage.getItem('token'))
      setMsg({ ...msg, profile: 'پروفایل بروزرسانی شد ✓' })
    } catch {
      setErr({ ...err, profile: 'خطا در بروزرسانی پروفایل' })
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    setMsg({ ...msg, password: '' })
    setErr({ ...err, password: '' })
    if (passwords.new_password !== passwords.confirm) {
      setErr({ ...err, password: 'رمز عبور جدید و تکرار آن یکسان نیستند' })
      return
    }
    if (passwords.new_password.length < 6) {
      setErr({ ...err, password: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد' })
      return
    }
    try {
      await api.patch('/profile/change-password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      })
      setMsg({ ...msg, password: 'رمز عبور با موفقیت تغییر کرد ✓' })
      setPasswords({ current_password: '', new_password: '', confirm: '' })
    } catch (e) {
      setErr({ ...err, password: e.response?.data?.detail || 'خطا در تغییر رمز عبور' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">پروفایل کاربری</h2>

      {/* اطلاعات کاربر */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-700">
            {user?.full_name?.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-800 text-lg">{user?.full_name}</p>
            <p className="text-gray-500 text-sm">{user?.username}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={updateProfile} className="space-y-4">
          <h3 className="font-medium text-gray-700 border-b pb-2">ویرایش اطلاعات</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نام و نام خانوادگی</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نام کاربری</label>
            <input
              type="text"
              value={user?.username}
              disabled
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-400"
            />
          </div>
          {msg.profile && <p className="text-green-600 text-sm">{msg.profile}</p>}
          {err.profile && <p className="text-red-600 text-sm">{err.profile}</p>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            ذخیره تغییرات
          </button>
        </form>
      </div>

      {/* تغییر رمز عبور */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={changePassword} className="space-y-4">
          <h3 className="font-medium text-gray-700 border-b pb-2">تغییر رمز عبور</h3>
          <div>
            <label className="block text-sm text-gray-600 mb-1">رمز عبور فعلی</label>
            <input
              type="password"
              value={passwords.current_password}
              onChange={e => setPasswords({...passwords, current_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">رمز عبور جدید</label>
            <input
              type="password"
              value={passwords.new_password}
              onChange={e => setPasswords({...passwords, new_password: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">تکرار رمز عبور جدید</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {msg.password && <p className="text-green-600 text-sm">{msg.password}</p>}
          {err.password && <p className="text-red-600 text-sm">{err.password}</p>}
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 text-sm">
            تغییر رمز عبور
          </button>
        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../AuthContext'
import Profile from './Profile'
import Admin from './Admin'
import SubmitReport from './SubmitReport'
import ManagerDashboard from './ManagerDashboard'
import CompanyDashboard from './CompanyDashboard'
import { roleLabels } from '../utils/roles'

export default function Dashboard() {
  const { user, logout, appConfig } = useAuth()
  const [activePage, setActivePage] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isManager = ['manager','company_manager','superadmin'].includes(user?.role)
  const isCompanyManager = ['company_manager','superadmin'].includes(user?.role) || user?.is_system_admin
  const isAdmin = user?.is_system_admin || user?.role === 'superadmin'

  const menuItems = [
    { key: 'home', label: '🏠 خانه', show: true },
    { key: 'submit-report', label: '📝 گزارش کار', show: true },
    { key: 'manager-dashboard', label: '📊 داشبورد مدیریت', show: isManager },
    { key: 'company-dashboard', label: '🏢 گزارش شرکت', show: isCompanyManager },
    { key: 'admin', label: '⚙️ مدیریت سیستم', show: isAdmin },
    { key: 'profile', label: '👤 پروفایل', show: true },
  ]

  const navigate = (key) => {
    setActivePage(key)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-blue-700 text-white px-4 py-3 flex justify-between items-center shadow sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-600 transition-colors">
            <div className="w-5 h-0.5 bg-white mb-1"></div>
            <div className="w-5 h-0.5 bg-white mb-1"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </button>
          <h1 className="text-base lg:text-lg font-bold">{appConfig.app_title}</h1>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <span className="text-sm hidden sm:block">{user?.full_name}</span>
          <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full hidden sm:block">{roleLabels[user?.role]}</span>
          <button onClick={logout} className="bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded text-sm">خروج</button>
        </div>
      </nav>

      <div className="flex flex-1 relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        <aside className={`
          fixed lg:static top-0 right-0 h-full w-56 bg-white shadow-lg lg:shadow-sm
          border-l border-gray-200 p-4 z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-4
        `}>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 lg:hidden">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role]}</p>
            </div>
          </div>
          <ul className="space-y-1">
            {menuItems.filter(m => m.show).map(item => (
              <li key={item.key}>
                <button onClick={() => navigate(item.key)}
                  className={`w-full text-right px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activePage === item.key
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 p-4 lg:p-6 min-w-0">
          {activePage === 'home' && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">خوش آمدید، {user?.full_name}</h2>
              <p className="text-gray-500 text-sm">{appConfig.company_name} — از منوی سمت راست گزینه مورد نظر را انتخاب کنید.</p>
            </div>
          )}
          {activePage === 'submit-report' && <SubmitReport />}
          {activePage === 'manager-dashboard' && <ManagerDashboard />}
          {activePage === 'company-dashboard' && <CompanyDashboard />}
          {activePage === 'admin' && <Admin />}
          {activePage === 'profile' && <Profile />}
        </main>
      </div>
    </div>
  )
}

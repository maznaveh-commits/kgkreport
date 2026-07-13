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
    { key: 'home', label: 'خانه', icon: '🏠', show: true },
    { key: 'submit-report', label: 'گزارش کار', icon: '📝', show: true },
    { key: 'manager-dashboard', label: 'داشبورد مدیریت', icon: '📊', show: isManager },
    { key: 'company-dashboard', label: 'گزارش شرکت', icon: '🏢', show: isCompanyManager },
    { key: 'admin', label: 'مدیریت سیستم', icon: '⚙️', show: isAdmin },
    { key: 'profile', label: 'پروفایل', icon: '👤', show: true },
  ]

  const navigate = (key) => {
    setActivePage(key)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="glass-strong sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(o => !o)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base lg:text-lg font-bold text-gradient">{appConfig.app_title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-300 hidden sm:block">{user?.full_name}</span>
          <span className="badge badge-blue hidden sm:block">{roleLabels[user?.role]}</span>
          <button onClick={logout}
            className="glass-btn-secondary px-4 py-1.5 rounded-xl text-sm">
            خروج
          </button>
        </div>
      </nav>

      <div className="flex flex-1 relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static top-0 right-0 h-full w-60 z-40
          glass-strong rounded-l-2xl lg:rounded-none
          transition-transform duration-300 ease-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-4 px-3 pb-4
        `}>
          {/* User card - mobile only */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-blue-300 font-bold text-sm">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <p className="text-xs text-slate-400">{roleLabels[user?.role]}</p>
            </div>
          </div>

          <ul className="space-y-1">
            {menuItems.filter(m => m.show).map(item => (
              <li key={item.key}>
                <button onClick={() => navigate(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activePage === item.key
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}>
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          {activePage === 'home' && (
            <div className="glass-card p-6 lg:p-8">
              <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
                خوش آمدید، <span className="text-gradient">{user?.full_name}</span>
              </h2>
              <p className="text-slate-400 text-sm">{appConfig.company_name} — از منوی سمت راست گزینه مورد نظر را انتخاب کنید.</p>
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

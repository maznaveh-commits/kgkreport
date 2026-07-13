import { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [appConfig, setAppConfig] = useState({
    company_name: 'کاجیکا',
    app_title: 'سیستم گزارش کار روزانه',
  })
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    api.get('/config').then(r => {
      setAppConfig(r.data)
      document.title = r.data.app_title
    }).catch(() => {
      setAppConfig({ company_name: 'کاجیکا', app_title: 'سیستم گزارش کار روزانه' })
    }).finally(() => {
      setConfigLoaded(true)
    })
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!configLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, appConfig }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

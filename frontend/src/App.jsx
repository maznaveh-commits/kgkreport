import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    </Routes>
  )
}

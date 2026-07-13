import { useState, useEffect } from 'react'
import api from '../api'
import RelationsTab from '../components/RelationsTab'
import Toast from '../components/Toast'
import { roleLabels, roleColors } from '../utils/roles'

export default function Admin() {
  const [tab, setTab] = useState('departments')
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [relations, setRelations] = useState([])
  const [toast, setToast] = useState(null)
  const [deptForm, setDeptForm] = useState({ name: '', description: '' })
  const [editDept, setEditDept] = useState(null)
  const [userForm, setUserForm] = useState({ full_name: '', username: '', password: '', role: 'staff', department_id: '', is_system_admin: false })
  const [editUser, setEditUser] = useState(null)
  const [editUserForm, setEditUserForm] = useState({})

  const notify = (m, isErr=false) => setToast({ message: m, type: isErr ? 'error' : 'success' })

  const fetchAll = async () => {
    try {
      const [u, d, r] = await Promise.all([
        api.get('/users/'),
        api.get('/departments/'),
        api.get('/users/relations'),
      ])
      setUsers(u.data)
      setDepartments(d.data)
      setRelations(r.data)
    } catch (e) {
      notify('خطا در دریافت اطلاعات', true)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const saveDept = async (e) => {
    e.preventDefault()
    try {
      if (editDept) {
        await api.patch(`/departments/${editDept.id}`, deptForm)
        notify('واحد با موفقیت ویرایش شد')
        setEditDept(null)
      } else {
        await api.post('/departments/', deptForm)
        notify('واحد با موفقیت ایجاد شد')
      }
      setDeptForm({ name: '', description: '' })
      fetchAll()
    } catch (e) { notify(e.response?.data?.detail || 'خطا در ذخیره', true) }
  }

  const deleteDept = async (id) => {
    if (!confirm('حذف شود؟')) return
    try { await api.delete(`/departments/${id}`); notify('واحد حذف شد'); fetchAll() }
    catch { notify('خطا در حذف', true) }
  }

  const createUser = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...userForm }
      if (!payload.department_id) delete payload.department_id
      await api.post('/users/', payload)
      notify(`کاربر "${userForm.full_name}" با موفقیت ایجاد شد`)
      setUserForm({ full_name: '', username: '', password: '', role: 'staff', department_id: '', is_system_admin: false })
      fetchAll()
    } catch (e) { notify(e.response?.data?.detail || 'خطا در ایجاد کاربر', true) }
  }

  const openEdit = (u) => {
    setEditUser(u)
    setEditUserForm({
      full_name: u.full_name,
      role: u.role,
      department_id: u.department_id || '',
      is_active: u.is_active,
      is_system_admin: u.is_system_admin || false,
      new_password: '',
    })
  }

  const saveUser = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...editUserForm }
      if (!payload.department_id) payload.department_id = null
      if (!payload.new_password) delete payload.new_password
      await api.patch(`/users/${editUser.id}`, payload)
      notify(`اطلاعات "${editUser.full_name}" با موفقیت ذخیره شد`)
      setEditUser(null)
      fetchAll()
    } catch (e) { notify(e.response?.data?.detail || 'خطا در ذخیره', true) }
  }

  const deleteUser = async (id, name) => {
    if (!confirm(`کاربر "${name}" حذف شود؟`)) return
    try { await api.delete(`/users/${id}`); notify('کاربر حذف شد'); fetchAll() }
    catch { notify('خطا در حذف', true) }
  }

  const activeDepts = departments.filter(d => d.is_active)

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <h2 className="text-xl font-bold text-gray-800">پنل مدیریت سیستم</h2>

      <div className="flex gap-2 border-b border-gray-200">
        {[['departments','🏢 واحدها'],['users','👥 کاربران'],['relations','🔗 روابط']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab===k ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab==='departments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">{editDept ? `ویرایش: ${editDept.name}` : 'ایجاد واحد جدید'}</h3>
            <form onSubmit={saveDept} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">نام واحد</label>
                <input type="text" required value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">توضیحات</label>
                <input type="text" value={deptForm.description} onChange={e => setDeptForm({...deptForm, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">{editDept ? 'ذخیره تغییرات' : 'ایجاد واحد'}</button>
                {editDept && <button type="button" onClick={() => { setEditDept(null); setDeptForm({name:'',description:''}) }} className="px-4 bg-gray-200 text-gray-700 rounded-lg text-sm">انصراف</button>}
              </div>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">واحدها ({departments.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {departments.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{d.name}</p>
                    {d.description && <p className="text-xs text-gray-500">{d.description}</p>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{d.is_active ? 'فعال' : 'غیرفعال'}</span>
                    <button onClick={() => { setEditDept(d); setDeptForm({name:d.name,description:d.description||''}) }} className="text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-50">ویرایش</button>
                    <button onClick={() => deleteDept(d.id)} className="text-red-400 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='users' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">ایجاد کاربر جدید</h3>
            <form onSubmit={createUser} className="space-y-3">
              {[['full_name','نام و نام خانوادگی','text'],['username','نام کاربری','text'],['password','رمز عبور اولیه','password']].map(([f,l,t]) => (
                <div key={f}>
                  <label className="block text-sm text-gray-600 mb-1">{l}</label>
                  <input type={t} required value={userForm[f]} onChange={e => setUserForm({...userForm,[f]:e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-600 mb-1">نقش اصلی</label>
                <select value={userForm.role} onChange={e => setUserForm({...userForm,role:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="company_manager">مدیر شرکت</option>
                  <option value="manager">مدیر واحد</option>
                  <option value="staff">پرسنل</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">واحد</label>
                <select value={userForm.department_id} onChange={e => setUserForm({...userForm,department_id:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">بدون واحد</option>
                  {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <input type="checkbox" id="new_is_admin" checked={userForm.is_system_admin} onChange={e => setUserForm({...userForm,is_system_admin:e.target.checked})} className="w-4 h-4 accent-purple-600" />
                <label htmlFor="new_is_admin" className="text-sm text-purple-700 font-medium">دسترسی ادمین سیستم</label>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">ایجاد کاربر</button>
            </form>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-medium text-gray-700 mb-4 border-b pb-2">کاربران ({users.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.username}{u.department_name && ` | ${u.department_name}`}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{roleLabels[u.role]}</span>
                      {u.is_system_admin && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">ادمین</span>}
                      {!u.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">غیرفعال</span>}
                      <button onClick={() => openEdit(u)} className="text-blue-500 text-xs px-2 py-1 rounded hover:bg-blue-50">ویرایش</button>
                      <button onClick={() => deleteUser(u.id,u.full_name)} className="text-red-400 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">ویرایش: {editUser.full_name}</h3>
            <form onSubmit={saveUser} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">نام و نام خانوادگی</label>
                <input type="text" value={editUserForm.full_name} onChange={e => setEditUserForm({...editUserForm,full_name:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">نقش اصلی</label>
                <select value={editUserForm.role} onChange={e => setEditUserForm({...editUserForm,role:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="company_manager">مدیر شرکت</option>
                  <option value="manager">مدیر واحد</option>
                  <option value="staff">پرسنل</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">واحد</label>
                <select value={editUserForm.department_id} onChange={e => setEditUserForm({...editUserForm,department_id:e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">بدون واحد</option>
                  {activeDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit_active" checked={editUserForm.is_active} onChange={e => setEditUserForm({...editUserForm,is_active:e.target.checked})} className="w-4 h-4" />
                <label htmlFor="edit_active" className="text-sm text-gray-600">حساب فعال باشد</label>
              </div>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <input type="checkbox" id="edit_admin" checked={editUserForm.is_system_admin} onChange={e => setEditUserForm({...editUserForm,is_system_admin:e.target.checked})} className="w-4 h-4 accent-purple-600" />
                <label htmlFor="edit_admin" className="text-sm text-purple-700 font-medium">دسترسی ادمین سیستم</label>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">رمز عبور جدید (اختیاری)</label>
                <input type="password" value={editUserForm.new_password} onChange={e => setEditUserForm({...editUserForm,new_password:e.target.value})}
                  placeholder="خالی بگذارید تا تغییر نکند"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700">ذخیره تغییرات</button>
                <button type="button" onClick={() => setEditUser(null)} className="flex-1 bg-gray-200 text-gray-700 rounded-lg py-2 text-sm">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab==='relations' && (
        <RelationsTab users={users} relations={relations} onRefresh={fetchAll} notify={notify} />
      )}
    </div>
  )
}

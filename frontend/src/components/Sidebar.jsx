import { NavLink } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

function Sidebar() {
  const { user } = useAuth()

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-indigo-50 text-indigo-600'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-56 bg-white border-r border-gray-200 flex flex-col gap-1 p-3 overflow-y-auto">
      <NavLink to="/dashboard" className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/schedule" className={linkClass}>
        Schedule
      </NavLink>
      <NavLink to="/attendance" className={linkClass}>
        Attendance
      </NavLink>
      <NavLink to="/chat" className={linkClass}>
        Chat
      </NavLink>
      {user && (user.role === 'owner' || user.role === 'manager') && (
        <>
          <NavLink to="/staff" className={linkClass}>
            Staff
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
        </>
      )}
    </aside>
  )
}

export default Sidebar
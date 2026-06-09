import useAuth from '../hooks/useAuth'
import { disconnectSocket } from '../services/socket'

function Navbar() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    disconnectSocket()
    logout()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-indigo-600">Crewly</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium capitalize">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
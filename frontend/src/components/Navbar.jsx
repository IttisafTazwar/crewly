import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { disconnectSocket } from '../services/socket'
import { getMyNotifications, markNotificationsRead } from '../services/api'

function Navbar() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await getMyNotifications()
      setNotifications(res.data.notifications)
      setUnreadCount(res.data.unreadCount)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications)
    if (!showNotifications && unreadCount > 0) {
      try {
        await markNotificationsRead()
        setUnreadCount(0)
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    }
  }

  const handleLogout = () => {
    disconnectSocket()
    logout()
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-xl font-bold text-indigo-600">Crewly</Link>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600">{user.firstName} {user.lastName}</span>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium capitalize">
              {user.role}
            </span>

            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative text-gray-500 hover:text-indigo-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-gray-400 text-sm p-4 text-center">No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`p-4 border-b border-gray-50 ${!n.read ? 'bg-indigo-50' : ''}`}>
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.message}</p>
                          <p className="text-xs text-gray-300 mt-1">
                            {new Date(n.createdAt).toLocaleDateString('en-AU')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
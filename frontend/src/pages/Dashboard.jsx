import { useState, useEffect } from 'react'
import useAuth from '../hooks/useAuth'
import { getMyShifts, getAttendanceStatus, getAllAttendance, getUsers } from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const [myShifts, setMyShifts] = useState([])
  const [clockedIn, setClockedIn] = useState(false)
  const [totalStaff, setTotalStaff] = useState(0)
  const [activeClockins, setActiveClockins] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shiftsRes = await getMyShifts()
        const statusRes = await getAttendanceStatus()
        setMyShifts(shiftsRes.data.slice(0, 5))
        setClockedIn(statusRes.data.isClockedIn)

        if (user.role === 'owner' || user.role === 'manager') {
          const usersRes = await getUsers()
          const attendanceRes = await getAllAttendance()
          setTotalStaff(usersRes.data.length)
          setActiveClockins(attendanceRes.data.filter(a => a.status === 'active').length)
        }
      } catch (error) {
        console.error('Dashboard error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const todayShifts = myShifts.filter(s => {
    const shiftDate = new Date(s.date).toDateString()
    const today = new Date().toDateString()
    return shiftDate === today
  })

  const upcomingShifts = myShifts.filter(s => {
    const shiftDate = new Date(s.date)
    const today = new Date()
    return shiftDate > today
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Clock Status</p>
          <p className={`text-2xl font-bold mt-1 ${clockedIn ? 'text-green-500' : 'text-gray-400'}`}>
            {clockedIn ? 'Clocked In' : 'Clocked Out'}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Today's Shifts</p>
          <p className="text-2xl font-bold mt-1 text-indigo-600">{todayShifts.length}</p>
        </div>
        {(user.role === 'owner' || user.role === 'manager') && (
          <>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold mt-1 text-indigo-600">{totalStaff}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500">Currently Clocked In</p>
              <p className="text-2xl font-bold mt-1 text-green-500">{activeClockins}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Today's Shifts</h2>
          {todayShifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No shifts scheduled for today</p>
          ) : (
            <div className="flex flex-col gap-3">
              {todayShifts.map(shift => (
                <div key={shift._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{shift.position || 'General'}</p>
                    <p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Upcoming Shifts</h2>
          {upcomingShifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming shifts</p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingShifts.map(shift => (
                <div key={shift._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(shift.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime} · {shift.position || 'General'}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                    {shift.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
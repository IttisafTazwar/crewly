import { useState, useEffect } from 'react'
import { clockIn, clockOut, getMyAttendance, getAttendanceStatus, getAllAttendance } from '../services/api'
import useAuth from '../hooks/useAuth'

function Attendance() {
  const { user } = useAuth()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState(null)
  const [records, setRecords] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [allAttendance, setAllAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    try {
      const statusRes = await getAttendanceStatus()
      setIsClockedIn(statusRes.data.isClockedIn)
      setClockInTime(statusRes.data.clockIn)

      const myRes = await getMyAttendance()
      setRecords(myRes.data.records)
      setTotalHours(myRes.data.totalHours)

      if (user.role === 'owner' || user.role === 'manager') {
        const allRes = await getAllAttendance()
        setAllAttendance(allRes.data)
      }
    } catch (error) {
      console.error('Attendance error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleClockIn = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await clockIn()
      setSuccess('Clocked in successfully!')
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Clock in failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClockOut = async () => {
    setActionLoading(true)
    setError('')
    setSuccess('')
    try {
      await clockOut()
      setSuccess('Clocked out successfully!')
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Clock out failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">Clock In / Out</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isClockedIn ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">
              {isClockedIn ? `Clocked in at ${new Date(clockInTime).toLocaleTimeString('en-AU')}` : 'Currently clocked out'}
            </span>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleClockIn}
              disabled={isClockedIn || actionLoading}
              className="flex-1 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-40"
            >
              Clock In
            </button>
            <button
              onClick={handleClockOut}
              disabled={!isClockedIn || actionLoading}
              className="flex-1 bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition disabled:opacity-40"
            >
              Clock Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-2">This Week</h2>
          <p className="text-4xl font-bold text-indigo-600">{totalHours}h</p>
          <p className="text-gray-400 text-sm mt-1">Total hours worked</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-4">My Attendance History</h2>
        {records.length === 0 ? (
          <p className="text-gray-400 text-sm">No attendance records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Clock In</th>
                  <th className="pb-3 font-medium">Clock Out</th>
                  <th className="pb-3 font-medium">Hours</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record._id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-700">
                      {new Date(record.clockIn).toLocaleDateString('en-AU')}
                    </td>
                    <td className="py-3 text-gray-700">
                      {new Date(record.clockIn).toLocaleTimeString('en-AU')}
                    </td>
                    <td className="py-3 text-gray-700">
                      {record.clockOut ? new Date(record.clockOut).toLocaleTimeString('en-AU') : '—'}
                    </td>
                    <td className="py-3 text-gray-700">{record.totalHours}h</td>
                    <td className="py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        record.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(user.role === 'owner' || user.role === 'manager') && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">All Staff Attendance</h2>
          {allAttendance.length === 0 ? (
            <p className="text-gray-400 text-sm">No attendance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Clock In</th>
                    <th className="pb-3 font-medium">Clock Out</th>
                    <th className="pb-3 font-medium">Hours</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttendance.map(record => (
                    <tr key={record._id} className="border-b border-gray-50">
                      <td className="py-3 text-gray-700">
                        {record.userId?.firstName} {record.userId?.lastName}
                      </td>
                      <td className="py-3 text-gray-700">
                        {new Date(record.clockIn).toLocaleDateString('en-AU')}
                      </td>
                      <td className="py-3 text-gray-700">
                        {new Date(record.clockIn).toLocaleTimeString('en-AU')}
                      </td>
                      <td className="py-3 text-gray-700">
                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString('en-AU') : '—'}
                      </td>
                      <td className="py-3 text-gray-700">{record.totalHours}h</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          record.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Attendance
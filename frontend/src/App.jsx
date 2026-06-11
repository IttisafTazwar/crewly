import { useState, useEffect } from 'react'
import { clockIn, clockOut, getMyAttendance, getAttendanceStatus, getAllAttendance, getUsers, createManualAttendance, editAttendanceRecord } from '../services/api'
import useAuth from '../hooks/useAuth'
import useFlash from '../hooks/useFlash'

function Attendance() {
  const { user } = useAuth()
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState(null)
  const [records, setRecords] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [allAttendance, setAllAttendance] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const { success, setSuccess, error, setError } = useFlash()
  const [showManualForm, setShowManualForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [manualForm, setManualForm] = useState({
    userId: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
  })
  const [editForm, setEditForm] = useState({
    startTime: '',
    endTime: '',
    reason: '',
  })

  const isManagerOrOwner = user.role === 'owner' || user.role === 'manager'

  const fetchData = async () => {
    try {
      const statusRes = await getAttendanceStatus()
      setIsClockedIn(statusRes.data.isClockedIn)
      setClockInTime(statusRes.data.clockIn)

      const myRes = await getMyAttendance()
      setRecords(myRes.data.records)
      setTotalHours(myRes.data.totalHours)

      if (isManagerOrOwner) {
        const allRes = await getAllAttendance()
        setAllAttendance(allRes.data)
        const usersRes = await getUsers()
        setUsers(usersRes.data)
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

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await createManualAttendance(manualForm)
      setSuccess('Manual attendance record created successfully!')
      setManualForm({ userId: '', date: '', startTime: '', endTime: '', reason: '' })
      setShowManualForm(false)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create record')
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await editAttendanceRecord(editingRecord._id, editForm)
      setSuccess('Attendance record updated successfully!')
      setEditingRecord(null)
      setEditForm({ startTime: '', endTime: '', reason: '' })
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record')
    }
  }

  const handleEditClick = (record) => {
    setEditingRecord(record)
    setEditForm({
      startTime: new Date(record.clockIn).toTimeString().slice(0, 5),
      endTime: record.clockOut ? new Date(record.clockOut).toTimeString().slice(0, 5) : '',
      reason: record.reason || '',
    })
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
                        {record.manualEntry ? 'manual' : record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isManagerOrOwner && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">All Staff Attendance</h2>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              {showManualForm ? 'Cancel' : '+ Manual Entry'}
            </button>
          </div>

          {showManualForm && (
            <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-indigo-50 rounded-xl">
              <h3 className="sm:col-span-2 font-medium text-gray-800">Add Manual Attendance Record</h3>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Employee</label>
                <select
                  value={manualForm.userId}
                  onChange={e => setManualForm({ ...manualForm, userId: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select employee</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={manualForm.date}
                  onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  value={manualForm.startTime}
                  onChange={e => setManualForm({ ...manualForm, startTime: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  value={manualForm.endTime}
                  onChange={e => setManualForm({ ...manualForm, endTime: e.target.value })}
                  required
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={manualForm.reason}
                  onChange={e => setManualForm({ ...manualForm, reason: e.target.value })}
                  placeholder="e.g. Emergency call-in, forgot to clock in"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Create Record
                </button>
              </div>
            </form>
          )}

          {editingRecord && (
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-yellow-50 rounded-xl">
              <h3 className="sm:col-span-2 font-medium text-gray-800">Edit Attendance Record</h3>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="time"
                  value={editForm.startTime}
                  onChange={e => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  value={editForm.endTime}
                  onChange={e => setEditForm({ ...editForm, endTime: e.target.value })}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. Correcting wrong clock out time"
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="submit"
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition"
                >
                  Update Record
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

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
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Actions</th>
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
                          record.manualEntry ? 'bg-yellow-100 text-yellow-700' :
                          record.autoClockOut ? 'bg-orange-100 text-orange-700' :
                          record.status === 'active' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {record.manualEntry ? 'manual' : record.autoClockOut ? 'auto' : record.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleEditClick(record)}
                          className="text-indigo-500 hover:text-indigo-700 text-xs font-medium transition"
                        >
                          Edit
                        </button>
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
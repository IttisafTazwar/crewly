import { useState, useEffect } from 'react'
import { getShifts, getMyShifts, createShift, deleteShift, getUsers } from '../services/api'
import useAuth from '../hooks/useAuth'

function Schedule() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    userId: '',
    date: '',
    startTime: '',
    endTime: '',
    position: '',
    notes: '',
  })

  const isManagerOrOwner = user.role === 'owner' || user.role === 'manager'

  const fetchData = async () => {
    try {
      const shiftsRes = isManagerOrOwner ? await getShifts() : await getMyShifts()
      setShifts(shiftsRes.data)
      if (isManagerOrOwner) {
        const usersRes = await getUsers()
        setUsers(usersRes.data)
      }
    } catch (error) {
      console.error('Schedule error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setSuccess('')

  if (form.startTime >= form.endTime) {
    setError('End time must be after start time')
    return
  }

  const selectedDate = new Date(form.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (selectedDate < today) {
    setError('Cannot assign shifts to past dates')
    return
  }

  try {
    await createShift(form)
    setSuccess('Shift created successfully!')
    setForm({ userId: '', date: '', startTime: '', endTime: '', position: '', notes: '' })
    setShowForm(false)
    fetchData()
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to create shift')
  }
}
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this shift?')) return
    try {
      await deleteShift(id)
      setSuccess('Shift deleted successfully')
      fetchData()
    } catch (err) {
      setError('Failed to delete shift')
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        {isManagerOrOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            {showForm ? 'Cancel' : '+ Assign Shift'}
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}

      {showForm && isManagerOrOwner && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Assign New Shift</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Employee</label>
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select employee</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.firstName} {u.lastName} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Start Time</label>
              <input
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">End Time</label>
              <input
                name="endTime"
                type="time"
                value={form.endTime}
                onChange={handleChange}
                required
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Position</label>
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="e.g. Cashier"
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Optional notes"
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Assign Shift
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
              {isManagerOrOwner && <th className="px-6 py-4 font-medium">Employee</th>}
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium">Start</th>
              <th className="px-6 py-4 font-medium">End</th>
              <th className="px-6 py-4 font-medium">Position</th>
              <th className="px-6 py-4 font-medium">Status</th>
              {isManagerOrOwner && <th className="px-6 py-4 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                  No shifts found
                </td>
              </tr>
            ) : (
              shifts.map(shift => (
                <tr key={shift._id} className="border-b border-gray-50 hover:bg-gray-50">
                  {isManagerOrOwner && (
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {shift.userId?.firstName} {shift.userId?.lastName}
                    </td>
                  )}
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(shift.date).toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{shift.startTime}</td>
                  <td className="px-6 py-4 text-gray-600">{shift.endTime}</td>
                  <td className="px-6 py-4 text-gray-600">{shift.position || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium capitalize">
                      {shift.status}
                    </span>
                  </td>
                  {isManagerOrOwner && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDelete(shift._id)}
                        className="text-red-500 hover:text-red-700 text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Schedule
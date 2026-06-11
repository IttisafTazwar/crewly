import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const registerBusiness = (data) => api.post('/api/auth/register', data)
export const login = (data) => api.post('/api/auth/login', data)
export const getMe = () => api.get('/api/auth/me')

// Users
export const getUsers = () => api.get('/api/users')
export const getUserById = (id) => api.get(`/api/users/${id}`)
export const createUser = (data) => api.post('/api/users', data)
export const updateUser = (id, data) => api.put(`/api/users/${id}`, data)
export const deactivateUser = (id) => api.delete(`/api/users/${id}`)

// Shifts
export const getShifts = () => api.get('/api/shifts')
export const getMyShifts = () => api.get('/api/shifts/my')
export const createShift = (data) => api.post('/api/shifts', data)
export const updateShift = (id, data) => api.put(`/api/shifts/${id}`, data)
export const deleteShift = (id) => api.delete(`/api/shifts/${id}`)

// Attendance
export const clockIn = () => api.post('/api/attendance/clockin', {})
export const clockOut = () => api.post('/api/attendance/clockout', {})
export const getMyAttendance = (week) => api.get(`/api/attendance/my${week ? `?week=${week}` : ''}`)
export const getAttendanceStatus = () => api.get('/api/attendance/status')
export const getAllAttendance = () => api.get('/api/attendance')

// Chat
export const getMyGroups = () => api.get('/api/chat/groups')
export const createGroup = (data) => api.post('/api/chat/groups', data)
export const getGroupMessages = (groupId) => api.get(`/api/chat/groups/${groupId}/messages`)
export const sendMessage = (groupId, data) => api.post(`/api/chat/groups/${groupId}/messages`, data)
export const addMember = (groupId, data) => api.put(`/api/chat/groups/${groupId}/members`, data)

// Notifications
export const getMyNotifications = () => api.get('/api/notifications')
export const markNotificationsRead = () => api.put('/api/notifications/read')
export const createManualAttendance = (data) => api.post('/api/attendance/manual', data)
export const editAttendanceRecord = (id, data) => api.put(`/api/attendance/${id}`, data)
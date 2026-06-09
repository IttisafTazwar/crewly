import axios from 'axios'

const BASE_URL = 'http://localhost:5000'

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
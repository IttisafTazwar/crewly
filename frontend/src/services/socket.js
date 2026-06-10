import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

let socket = null

export const connectSocket = (token) => {
  socket = io(SOCKET_URL, {
    auth: { token },
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected')
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const joinGroup = (groupId) => {
  if (socket) {
    socket.emit('join_group', groupId)
  }
}

export const sendSocketMessage = (data) => {
  if (socket) {
    socket.emit('send_message', data)
  }
}

export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.on('receive_message', callback)
  }
}

export const offReceiveMessage = () => {
  if (socket) {
    socket.off('receive_message')
  }
}
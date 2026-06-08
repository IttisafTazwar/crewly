import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import connectDB from './src/db.js'
import authRouter from './src/routes/auth.js'
import userRouter from './src/routes/users.js'
import shiftRouter from './src/routes/shifts.js'
import attendanceRouter from './src/routes/attendance.js'
import chatRouter from './src/routes/chat.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 5000

connectDB()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/shifts', shiftRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/chat', chatRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Crewly API is running' })
})

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  socket.on('join_group', (groupId) => {
    socket.join(groupId)
    console.log(`User ${socket.id} joined group ${groupId}`)
  })

  socket.on('send_message', (data) => {
    io.to(data.groupId).emit('receive_message', data)
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

export { io }

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
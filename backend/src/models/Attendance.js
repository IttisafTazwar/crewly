import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shiftId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shift',
    default: null,
  },
  clockIn: {
    type: Date,
    required: true,
  },
  clockOut: {
    type: Date,
    default: null,
  },
  totalHours: {
    type: Number,
    default: 0,
  },
  overtimeHours: {
    type: Number,
    default: 0,
  },
  autoClockOut: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Attendance', attendanceSchema)
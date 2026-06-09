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
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

attendanceSchema.methods.calculateHours = function () {
  if (this.clockIn && this.clockOut) {
    const diff = this.clockOut - this.clockIn
    this.totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
  }
}

export default mongoose.model('Attendance', attendanceSchema)
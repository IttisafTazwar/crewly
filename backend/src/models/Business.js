import mongoose from 'mongoose'

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  industry: {
    type: String,
    default: 'Retail',
  },
  address: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    default: '',
  },
  logo: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'Australia/Sydney',
  },
  weekStartDay: {
    type: String,
    enum: ['monday', 'sunday'],
    default: 'monday',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Business', businessSchema)
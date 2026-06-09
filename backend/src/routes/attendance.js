import express from 'express'
import {
  clockIn,
  clockOut,
  getMyAttendance,
  getAllAttendance,
  getStatus,
} from '../controllers/attendanceController.js'
import protect from '../middleware/auth.js'
import authorise from '../middleware/role.js'

const router = express.Router()

router.post('/clockin', protect, clockIn)
router.post('/clockout', protect, clockOut)
router.get('/my', protect, getMyAttendance)
router.get('/status', protect, getStatus)
router.get('/', protect, authorise('owner', 'manager'), getAllAttendance)

export default router
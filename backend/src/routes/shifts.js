import express from 'express'
import {
  getShifts,
  getMyShifts,
  createShift,
  updateShift,
  deleteShift,
  requestSwap,
} from '../controllers/shiftController.js'
import protect from '../middleware/auth.js'
import authorise from '../middleware/role.js'

const router = express.Router()

router.get('/', protect, authorise('owner', 'manager'), getShifts)
router.get('/my', protect, getMyShifts)
router.post('/', protect, authorise('owner', 'manager'), createShift)
router.put('/:id', protect, authorise('owner', 'manager'), updateShift)
router.delete('/:id', protect, authorise('owner', 'manager'), deleteShift)
router.put('/:id/swap', protect, requestSwap)

export default router
import express from 'express'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
} from '../controllers/userController.js'
import protect from '../middleware/auth.js'
import authorise from '../middleware/role.js'

const router = express.Router()

router.get('/', protect, authorise('owner', 'manager'), getUsers)
router.get('/:id', protect, authorise('owner', 'manager'), getUserById)
router.post('/', protect, authorise('owner', 'manager'), createUser)
router.put('/:id', protect, authorise('owner', 'manager'), updateUser)
router.delete('/:id', protect, authorise('owner', 'manager'), deactivateUser)

export default router
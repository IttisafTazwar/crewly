import express from 'express'
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendMessage,
  addMember,
  deleteGroup,
} from '../controllers/chatController.js'
import protect from '../middleware/auth.js'
import authorise from '../middleware/role.js'

const router = express.Router()

router.post('/groups', protect, authorise('owner', 'manager'), createGroup)
router.get('/groups', protect, getMyGroups)
router.get('/groups/:groupId/messages', protect, getGroupMessages)
router.post('/groups/:groupId/messages', protect, sendMessage)
router.put('/groups/:groupId/members', protect, authorise('owner', 'manager'), addMember)
router.delete('/groups/:groupId', protect, authorise('owner', 'manager'), deleteGroup)

export default router
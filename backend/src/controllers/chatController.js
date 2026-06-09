import ChatGroup from '../models/ChatGroup.js'
import Message from '../models/Message.js'

export const createGroup = async (req, res) => {
  const { name, description, type, memberIds } = req.body

  try {
    const group = await ChatGroup.create({
      businessId: req.user.businessId,
      name,
      description: description || '',
      type: type || 'custom',
      createdBy: req.user._id,
      members: [req.user._id, ...(memberIds || [])],
    })

    const populated = await group.populate('members', 'firstName lastName role')

    res.status(201).json({ message: 'Group created successfully', group: populated })
  } catch (error) {
    res.status(500).json({ message: `Failed to create group: ${error.message}` })
  }
}

export const getMyGroups = async (req, res) => {
  try {
    const groups = await ChatGroup.find({
      businessId: req.user.businessId,
      members: req.user._id,
      isActive: true,
    }).populate('members', 'firstName lastName role')

    res.status(200).json(groups)
  } catch (error) {
    res.status(500).json({ message: `Failed to get groups: ${error.message}` })
  }
}

export const getGroupMessages = async (req, res) => {
  try {
    const group = await ChatGroup.findOne({
      _id: req.params.groupId,
      members: req.user._id,
      businessId: req.user.businessId,
    })

    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' })
    }

    const messages = await Message.find({ groupId: req.params.groupId })
      .populate('senderId', 'firstName lastName avatar')
      .sort({ createdAt: 1 })

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ message: `Failed to get messages: ${error.message}` })
  }
}

export const sendMessage = async (req, res) => {
  const { content } = req.body

  try {
    const group = await ChatGroup.findOne({
      _id: req.params.groupId,
      members: req.user._id,
      businessId: req.user.businessId,
    })

    if (!group) {
      return res.status(404).json({ message: 'Group not found or access denied' })
    }

    const message = await Message.create({
      businessId: req.user.businessId,
      groupId: req.params.groupId,
      senderId: req.user._id,
      content,
    })

    const populated = await message.populate('senderId', 'firstName lastName avatar')

    res.status(201).json({ message: 'Message sent', data: populated })
  } catch (error) {
    res.status(500).json({ message: `Failed to send message: ${error.message}` })
  }
}

export const addMember = async (req, res) => {
  const { userId } = req.body

  try {
    const group = await ChatGroup.findOneAndUpdate(
      { _id: req.params.groupId, businessId: req.user.businessId },
      { $addToSet: { members: userId } },
      { new: true }
    ).populate('members', 'firstName lastName role')

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.status(200).json({ message: 'Member added successfully', group })
  } catch (error) {
    res.status(500).json({ message: `Failed to add member: ${error.message}` })
  }
}

export const deleteGroup = async (req, res) => {
  try {
    const group = await ChatGroup.findOneAndUpdate(
      { _id: req.params.groupId, businessId: req.user.businessId },
      { isActive: false },
      { new: true }
    )

    if (!group) {
      return res.status(404).json({ message: 'Group not found' })
    }

    res.status(200).json({ message: 'Group deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: `Failed to delete group: ${error.message}` })
  }
}
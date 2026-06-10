import Notification from '../models/Notification.js'

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      businessId: req.user.businessId,
    }).sort({ createdAt: -1 }).limit(20)

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      businessId: req.user.businessId,
      read: false,
    })

    res.status(200).json({ notifications, unreadCount })
  } catch (error) {
    res.status(500).json({ message: `Failed to get notifications: ${error.message}` })
  }
}

export const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, businessId: req.user.businessId },
      { read: true }
    )
    res.status(200).json({ message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ message: `Failed to mark notifications: ${error.message}` })
  }
}

export const createNotification = async (businessId, userId, title, message, type) => {
  try {
    await Notification.create({ businessId, userId, title, message, type })
  } catch (error) {
    console.error('Failed to create notification:', error.message)
  }
}
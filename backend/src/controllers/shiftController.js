import Shift from '../models/Shift.js'

export const getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ businessId: req.user.businessId })
      .populate('userId', 'firstName lastName email role')
      .populate('assignedBy', 'firstName lastName')
      .sort({ date: 1 })
    res.status(200).json(shifts)
  } catch (error) {
    res.status(500).json({ message: `Failed to get shifts: ${error.message}` })
  }
}

export const getMyShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({
      businessId: req.user.businessId,
      userId: req.user._id,
    })
      .populate('assignedBy', 'firstName lastName')
      .sort({ date: 1 })
    res.status(200).json(shifts)
  } catch (error) {
    res.status(500).json({ message: `Failed to get shifts: ${error.message}` })
  }
}

export const createShift = async (req, res) => {
  const { userId, date, startTime, endTime, position, notes } = req.body

  try {
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }

    const shiftDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (shiftDate < today) {
      return res.status(400).json({ message: 'Cannot assign shifts to past dates' })
    }

    const overlapping = await Shift.findOne({
      userId,
      date,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    })

    if (overlapping) {
      return res.status(400).json({ message: 'Employee already has a shift during this time' })
    }

    const shift = await Shift.create({
      businessId: req.user.businessId,
      userId,
      assignedBy: req.user._id,
      date,
      startTime,
      endTime,
      position: position || '',
      notes: notes || '',
    })

    const populated = await shift.populate('userId', 'firstName lastName email')

    res.status(201).json({ message: 'Shift created successfully', shift: populated })
  } catch (error) {
    res.status(500).json({ message: `Failed to create shift: ${error.message}` })
  }
}

export const updateShift = async (req, res) => {
  const { date, startTime, endTime, position, notes, status } = req.body

  try {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { date, startTime, endTime, position, notes, status },
      { new: true }
    ).populate('userId', 'firstName lastName email')

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' })
    }

    res.status(200).json({ message: 'Shift updated successfully', shift })
  } catch (error) {
    res.status(500).json({ message: `Failed to update shift: ${error.message}` })
  }
}

export const deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findOneAndDelete({
      _id: req.params.id,
      businessId: req.user.businessId,
    })

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' })
    }

    res.status(200).json({ message: 'Shift deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: `Failed to delete shift: ${error.message}` })
  }
}

export const requestSwap = async (req, res) => {
  const { swapWithUserId } = req.body

  try {
    const shift = await Shift.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: 'swapRequested', swapRequestedWith: swapWithUserId },
      { new: true }
    )

    if (!shift) {
      return res.status(404).json({ message: 'Shift not found' })
    }

    res.status(200).json({ message: 'Swap requested successfully', shift })
  } catch (error) {
    res.status(500).json({ message: `Failed to request swap: ${error.message}` })
  }
}
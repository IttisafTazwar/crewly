import Attendance from '../models/Attendance.js'

export const clockIn = async (req, res) => {
  try {
    const existing = await Attendance.findOne({
      userId: req.user._id,
      status: 'active',
    })

    if (existing) {
      return res.status(400).json({ message: 'You are already clocked in' })
    }

    const attendance = await Attendance.create({
      businessId: req.user.businessId,
      userId: req.user._id,
      shiftId: req.body.shiftId || null,
      clockIn: new Date(),
    })

    res.status(201).json({ message: 'Clocked in successfully', attendance })
  } catch (error) {
    res.status(500).json({ message: `Clock in failed: ${error.message}` })
  }
}

export const clockOut = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      status: 'active',
    })

    if (!attendance) {
      return res.status(400).json({ message: 'You are not clocked in' })
    }

    const clockOutTime = new Date()
    const diff = clockOutTime - attendance.clockIn
    const totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))

    attendance.clockOut = clockOutTime
    attendance.status = 'completed'
    attendance.totalHours = totalHours
    await attendance.save()

    res.status(200).json({ message: 'Clocked out successfully', attendance })
  } catch (error) {
    res.status(500).json({ message: `Clock out failed: ${error.message}` })
  }
}

export const getMyAttendance = async (req, res) => {
  try {
    const { week } = req.query
    let filter = {
      userId: req.user._id,
      businessId: req.user.businessId,
    }

    if (week) {
      const startOfWeek = new Date(week)
      const endOfWeek = new Date(week)
      endOfWeek.setDate(endOfWeek.getDate() + 7)
      filter.clockIn = { $gte: startOfWeek, $lte: endOfWeek }
    }

    const records = await Attendance.find(filter).sort({ clockIn: -1 })

    const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0)

    res.status(200).json({
      records,
      totalHours: parseFloat(totalHours.toFixed(2)),
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to get attendance: ${error.message}` })
  }
}

export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ businessId: req.user.businessId })
      .populate('userId', 'firstName lastName email role')
      .sort({ clockIn: -1 })

    res.status(200).json(records)
  } catch (error) {
    res.status(500).json({ message: `Failed to get attendance: ${error.message}` })
  }
}

export const getStatus = async (req, res) => {
  try {
    const active = await Attendance.findOne({
      userId: req.user._id,
      status: 'active',
    })

    res.status(200).json({
      isClockedIn: !!active,
      clockIn: active ? active.clockIn : null,
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to get status: ${error.message}` })
  }
}
import Attendance from '../models/Attendance.js'
import Shift from '../models/Shift.js'

export const clockIn = async (req, res) => {
  try {
    const existing = await Attendance.findOne({
      userId: req.user._id,
      status: 'active',
    })

    if (existing) {
      return res.status(400).json({ message: 'You are already clocked in' })
    }

    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayShift = await Shift.findOne({
      userId: req.user._id,
      businessId: req.user.businessId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'scheduled',
    })

    if (!todayShift) {
      return res.status(400).json({ message: 'You have no scheduled shift today' })
    }

    const [shiftHour, shiftMinute] = todayShift.startTime.split(':').map(Number)
    const shiftStart = new Date()
    shiftStart.setHours(shiftHour, shiftMinute, 0, 0)

    const earliestClockIn = new Date(shiftStart.getTime() - 15 * 60 * 1000)

    if (now < earliestClockIn) {
      const minutesUntil = Math.ceil((earliestClockIn - now) / (1000 * 60))
      return res.status(400).json({
        message: `Too early to clock in. Your shift starts at ${todayShift.startTime}. You can clock in ${minutesUntil} minutes before your shift.`,
      })
    }

    const attendance = await Attendance.create({
      businessId: req.user.businessId,
      userId: req.user._id,
      shiftId: todayShift._id,
      clockIn: now,
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

    let overtimeHours = 0

    if (attendance.shiftId) {
      const shift = await Shift.findById(attendance.shiftId)
      if (shift) {
        const [endHour, endMinute] = shift.endTime.split(':').map(Number)
        const shiftEnd = new Date()
        shiftEnd.setHours(endHour, endMinute, 0, 0)

        if (clockOutTime > shiftEnd) {
          const overtimeDiff = clockOutTime - shiftEnd
          overtimeHours = parseFloat((overtimeDiff / (1000 * 60 * 60)).toFixed(2))
        }

        await Shift.findByIdAndUpdate(attendance.shiftId, { status: 'completed' })
      }
    }

    attendance.clockOut = clockOutTime
    attendance.status = 'completed'
    attendance.totalHours = totalHours
    attendance.overtimeHours = overtimeHours
    await attendance.save()

    res.status(200).json({
      message: 'Clocked out successfully',
      attendance,
      overtime: overtimeHours > 0,
      overtimeHours,
    })
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
    const totalOvertime = records.reduce((sum, r) => sum + r.overtimeHours, 0)

    res.status(200).json({
      records,
      totalHours: parseFloat(totalHours.toFixed(2)),
      totalOvertime: parseFloat(totalOvertime.toFixed(2)),
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to get attendance: ${error.message}` })
  }
}

export const getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ businessId: req.user.businessId })
      .populate('userId', 'firstName lastName email role')
      .populate('shiftId', 'startTime endTime position')
      .populate('enteredBy', 'firstName lastName')
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

    const now = new Date()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayShift = await Shift.findOne({
      userId: req.user._id,
      businessId: req.user.businessId,
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'scheduled',
    })

    let canClockIn = false
    let clockInMessage = 'No shift scheduled for today'

    if (todayShift) {
      const [shiftHour, shiftMinute] = todayShift.startTime.split(':').map(Number)
      const shiftStart = new Date()
      shiftStart.setHours(shiftHour, shiftMinute, 0, 0)
      const earliestClockIn = new Date(shiftStart.getTime() - 15 * 60 * 1000)

      if (now >= earliestClockIn) {
        canClockIn = true
        clockInMessage = `Shift starts at ${todayShift.startTime}`
      } else {
        const minutesUntil = Math.ceil((earliestClockIn - now) / (1000 * 60))
        clockInMessage = `Shift starts at ${todayShift.startTime} — clock in available in ${minutesUntil} minutes`
      }
    }

    res.status(200).json({
      isClockedIn: !!active,
      clockIn: active ? active.clockIn : null,
      canClockIn,
      clockInMessage,
      todayShift: todayShift || null,
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to get status: ${error.message}` })
  }
}

export const autoClockOut = async () => {
  try {
    const now = new Date()
    const activeRecords = await Attendance.find({ status: 'active' })

    for (const record of activeRecords) {
      if (!record.shiftId) continue

      const shift = await Shift.findById(record.shiftId)
      if (!shift) continue

      const [endHour, endMinute] = shift.endTime.split(':').map(Number)
      const shiftEnd = new Date()
      shiftEnd.setHours(endHour, endMinute, 0, 0)

      const autoClockOutTime = new Date(shiftEnd.getTime() + 30 * 60 * 1000)

      if (now >= autoClockOutTime) {
        const diff = shiftEnd - record.clockIn
        const totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))

        record.clockOut = shiftEnd
        record.status = 'completed'
        record.totalHours = totalHours
        record.overtimeHours = 0
        record.autoClockOut = true
        record.notes = 'Auto clocked out by system'
        await record.save()

        await Shift.findByIdAndUpdate(record.shiftId, { status: 'completed' })
      }
    }
  } catch (error) {
    console.error('Auto clock-out error:', error.message)
  }
}

export const createManualAttendance = async (req, res) => {
  const { userId, date, startTime, endTime, reason } = req.body

  try {
    if (!userId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'userId, date, startTime and endTime are required' })
    }

    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const clockIn = new Date(date)
    clockIn.setHours(startHour, startMinute, 0, 0)

    const clockOut = new Date(date)
    clockOut.setHours(endHour, endMinute, 0, 0)

    if (clockOut <= clockIn) {
      return res.status(400).json({ message: 'End time must be after start time' })
    }

    const diff = clockOut - clockIn
    const totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))

    const attendance = await Attendance.create({
      businessId: req.user.businessId,
      userId,
      clockIn,
      clockOut,
      totalHours,
      status: 'completed',
      manualEntry: true,
      enteredBy: req.user._id,
      reason: reason || 'Manual entry by manager',
    })

    const populated = await attendance.populate('userId', 'firstName lastName')

    res.status(201).json({ message: 'Attendance record created successfully', attendance: populated })
  } catch (error) {
    res.status(500).json({ message: `Failed to create attendance: ${error.message}` })
  }
}

export const editAttendance = async (req, res) => {
  const { startTime, endTime, reason } = req.body

  try {
    const attendance = await Attendance.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    })

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' })
    }

    const date = attendance.clockIn

    if (startTime) {
      const [startHour, startMinute] = startTime.split(':').map(Number)
      const newClockIn = new Date(date)
      newClockIn.setHours(startHour, startMinute, 0, 0)
      attendance.clockIn = newClockIn
    }

    if (endTime) {
      const [endHour, endMinute] = endTime.split(':').map(Number)
      const newClockOut = new Date(date)
      newClockOut.setHours(endHour, endMinute, 0, 0)
      attendance.clockOut = newClockOut
    }

    if (attendance.clockOut && attendance.clockIn) {
      const diff = attendance.clockOut - attendance.clockIn
      attendance.totalHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2))
    }

    attendance.manualEntry = true
    attendance.enteredBy = req.user._id
    attendance.reason = reason || 'Edited by manager'
    attendance.status = 'completed'

    await attendance.save()

    res.status(200).json({ message: 'Attendance record updated successfully', attendance })
  } catch (error) {
    res.status(500).json({ message: `Failed to edit attendance: ${error.message}` })
  }
}
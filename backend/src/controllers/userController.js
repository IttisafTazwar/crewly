import User from '../models/User.js'

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ businessId: req.user.businessId, isActive: true }).select('-password')
    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ message: `Failed to get users: ${error.message}` })
  }
}

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    }).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: `Failed to get user: ${error.message}` })
  }
}

export const createUser = async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const user = await User.create({
      businessId: req.user.businessId,
      firstName,
      lastName,
      email,
      password,
      role: role || 'employee',
      phone: phone || '',
    })

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        businessId: user.businessId,
      },
    })
  } catch (error) {
    res.status(500).json({ message: `Failed to create user: ${error.message}` })
  }
}

export const updateUser = async (req, res) => {
  const { firstName, lastName, phone, role, avatar } = req.body

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { firstName, lastName, phone, role, avatar },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'User updated successfully', user })
  } catch (error) {
    res.status(500).json({ message: `Failed to update user: ${error.message}` })
  }
}

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, businessId: req.user.businessId },
      { isActive: false },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({ message: 'User deactivated successfully', user })
  } catch (error) {
    res.status(500).json({ message: `Failed to deactivate user: ${error.message}` })
  }
}
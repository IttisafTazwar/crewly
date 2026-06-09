import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Business from '../models/Business.js'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const registerBusiness = async (req, res) => {
  const { businessName, industry, firstName, lastName, email, password } = req.body

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const business = await Business.create({
      name: businessName,
      industry: industry || 'Retail',
    })

    const owner = await User.create({
      businessId: business._id,
      firstName,
      lastName,
      email,
      password,
      role: 'owner',
    })

    res.status(201).json({
      message: 'Business registered successfully',
      token: generateToken(owner._id),
      user: {
        id: owner._id,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        role: owner.role,
        businessId: owner.businessId,
      },
    })
  } catch (error) {
    res.status(500).json({ message: `Registration failed: ${error.message}` })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email })

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Your account has been deactivated' })
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
    })
  } catch (error) {
    res.status(500).json({ message: `Login failed: ${error.message}` })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: `Failed to get user: ${error.message}` })
  }
}
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const protect = async (req, res, next) => {
  let token

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log('Decoded token:', decoded)
      
      req.user = await User.findById(decoded.id).select('-password')
      console.log('Found user:', req.user)
      
      return next()
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }
  } catch (error) {
    console.error('Auth error:', error.message)
    return res.status(401).json({ message: `Not authorized: ${error.message}` })
  }
}

export default protect
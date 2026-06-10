import { useState, useEffect } from 'react'

const useFlash = (duration = 4000) => {
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), duration)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), duration)
      return () => clearTimeout(timer)
    }
  }, [error])

  return { success, setSuccess, error, setError }
}

export default useFlash
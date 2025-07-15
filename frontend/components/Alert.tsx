import React from 'react'

interface AlertProps {
  message: string
  className?: string
}

const Alert: React.FC<AlertProps> = ({ message, className }) => {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm font-medium ${className || ''}`}
      role="alert"
    >
      <span className="text-xl">⚠️</span>
      <span>{message}</span>
    </div>
  )
}

export default Alert

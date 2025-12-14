import { Alert } from 'flowbite-react'
import React from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

export interface StatusAlertProps {
  type: 'success' | 'error'
  message: string
  theme?: any
  className?: string
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type,
  message,
  theme,
  className = 'mb-4',
}) => {
  const isSuccess = type === 'success'

  return (
    <Alert
      theme={theme}
      color={isSuccess ? 'success' : 'failure'}
      className={`${className} relative z-10 w-full`}
    >
      <div className="flex items-center">
        {isSuccess ? (
          <HiCheckCircle className="mr-2 h-4 w-4 shrink-0" />
        ) : (
          <HiExclamationCircle className="mr-2 h-4 w-4 shrink-0" />
        )}
        <span className="font-medium">{isSuccess ? 'Success!' : 'Error!'}</span>
        <span className="ml-1">{message}</span>
      </div>
    </Alert>
  )
}

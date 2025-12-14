import React from 'react'

export interface PasswordRequirement {
  text: string
  isValid?: boolean
}

export interface PasswordRequirementsProps {
  requirements?: PasswordRequirement[]
  className?: string
}

const defaultRequirements: PasswordRequirement[] = [
  { text: 'At least 10 characters (and up to 100 characters)' },
  { text: 'At least one lowercase character' },
  { text: 'Inclusion of at least one special character, e.g., ! @ # ?' },
]

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  requirements = defaultRequirements,
  className = '',
}) => {
  return (
    <div className={`col-span-full mb-3 ${className}`}>
      <div className="mt-3 mb-1 text-sm font-medium dark:text-white">
        Password requirements:
      </div>
      <div className="mb-1 text-sm font-normal text-gray-500 dark:text-gray-400">
        Ensure that these requirements are met:
      </div>
      <ul className="space-y-1 pl-4 text-gray-500 dark:text-gray-400">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`text-xs font-normal ${
              req.isValid !== undefined
                ? req.isValid
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                : ''
            }`}
          >
            {req.isValid !== undefined && (
              <span className="mr-1">{req.isValid ? '✓' : '✗'}</span>
            )}
            {req.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

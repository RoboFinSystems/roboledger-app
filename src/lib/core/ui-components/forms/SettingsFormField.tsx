import { Label, TextInput } from 'flowbite-react'
import React from 'react'

export interface SettingsFormFieldProps {
  id: string
  label: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'number'
  placeholder?: string
  defaultValue?: string
  value?: string
  required?: boolean
  disabled?: boolean
  theme?: any
  className?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  min?: string | number
  max?: string | number
}

export const SettingsFormField: React.FC<SettingsFormFieldProps> = ({
  id,
  label,
  name = id,
  type = 'text',
  placeholder,
  defaultValue,
  value,
  required = false,
  disabled = false,
  theme,
  className = '',
  onChange,
  min,
  max,
  ...props
}) => {
  return (
    <div className={`grid grid-cols-1 gap-y-3 ${className}`}>
      <Label theme={theme?.label} htmlFor={id}>
        {label}
      </Label>
      <TextInput
        theme={theme?.textInput}
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        required={required}
        disabled={disabled}
        onChange={onChange}
        min={min}
        max={max}
        {...props}
      />
    </div>
  )
}

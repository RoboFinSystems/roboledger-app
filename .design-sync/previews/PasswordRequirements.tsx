import { PasswordRequirements } from '@robosystems/core'

/** Default checklist — shown unvalidated beneath a new-password field at sign-up. */
export const Defaults = () => (
  <div className="max-w-sm">
    <PasswordRequirements />
  </div>
)

/** Live validation state: met rules turn green with a ✓, unmet turn red with a ✗. */
export const Validated = () => (
  <div className="max-w-sm">
    <PasswordRequirements
      requirements={[
        {
          text: 'At least 12 characters (and up to 128 characters)',
          isValid: true,
        },
        { text: 'At least one uppercase letter', isValid: true },
        { text: 'At least one lowercase letter', isValid: true },
        { text: 'At least one digit', isValid: false },
        {
          text: 'At least one special character, e.g., ! @ # $ % ^ & *',
          isValid: false,
        },
      ]}
    />
  </div>
)

/** All requirements satisfied — the full checklist confirming a strong password. */
export const AllMet = () => (
  <div className="max-w-sm">
    <PasswordRequirements
      requirements={[
        {
          text: 'At least 12 characters (and up to 128 characters)',
          isValid: true,
        },
        { text: 'At least one uppercase letter', isValid: true },
        { text: 'At least one lowercase letter', isValid: true },
        { text: 'At least one digit', isValid: true },
        {
          text: 'At least one special character, e.g., ! @ # $ % ^ & *',
          isValid: true,
        },
      ]}
    />
  </div>
)

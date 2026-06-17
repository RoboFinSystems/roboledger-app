import { StatusAlert } from '@robosystems/core'

/** Success confirmation. */
export const Success = () => (
  <StatusAlert type="success" message="Your graph was created successfully." />
)

/** Error feedback. */
export const Error = () => (
  <StatusAlert
    type="error"
    message="Could not connect to the repository. Try again."
  />
)

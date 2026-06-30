import { ContactForm } from 'roboledger-app'

/** The contact form on its own — name, email, company, and message fields on a
 *  dark sheet, with the violet submit action. (`onClose` is a no-op here; the
 *  Turnstile CAPTCHA only mounts when a site key is configured.) */
export const Default = () => (
  <div className="max-w-lg rounded-lg border border-gray-700 bg-linear-to-br from-zinc-900 to-zinc-800 p-8">
    <ContactForm onClose={() => {}} formType="general" />
  </div>
)

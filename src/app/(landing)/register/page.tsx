import type { Metadata } from 'next'
import RegisterForm from './content'

export const metadata: Metadata = {
  title: 'Create Account | RoboLedger',
  description:
    'Create a RoboLedger account — AI-native financial reporting that turns natural language into validated financial statements.',
  // Registration is moving to the centralized login home; this page is (or
  // is becoming) a redirector, so keep it out of the index.
  robots: { index: false, follow: true },
}

export default function RegisterPage() {
  return <RegisterForm />
}

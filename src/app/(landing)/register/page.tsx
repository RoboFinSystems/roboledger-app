import type { Metadata } from 'next'
import RegisterForm from './content'

export const metadata: Metadata = {
  title: 'Create Account | RoboLedger',
  description:
    'Create a RoboLedger account — AI-native financial reporting that turns natural language into validated financial statements.',
  alternates: { canonical: 'https://roboledger.ai/register' },
}

export default function RegisterPage() {
  return <RegisterForm />
}

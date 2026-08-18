import type { Metadata } from 'next'
import EducationScreen from '@/components/admin/screens/EducationScreen'

export const metadata: Metadata = { title: 'Education' }

export default function Page() {
  return <EducationScreen />
}

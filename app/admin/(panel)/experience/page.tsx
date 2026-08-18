import type { Metadata } from 'next'
import ExperienceScreen from '@/components/admin/screens/ExperienceScreen'

export const metadata: Metadata = { title: 'Experience' }

export default function Page() {
  return <ExperienceScreen />
}

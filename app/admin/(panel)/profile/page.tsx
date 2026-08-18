import type { Metadata } from 'next'
import ProfileScreen from '@/components/admin/screens/ProfileScreen'

export const metadata: Metadata = { title: 'Profile' }

export default function Page() {
  return <ProfileScreen />
}

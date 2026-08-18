import type { Metadata } from 'next'
import AchievementsScreen from '@/components/admin/screens/AchievementsScreen'

export const metadata: Metadata = { title: 'Achievements' }

export default function Page() {
  return <AchievementsScreen />
}

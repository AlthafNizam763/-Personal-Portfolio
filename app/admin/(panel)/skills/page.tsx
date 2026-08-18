import type { Metadata } from 'next'
import SkillsScreen from '@/components/admin/screens/SkillsScreen'

export const metadata: Metadata = { title: 'Skills' }

export default function Page() {
  return <SkillsScreen />
}

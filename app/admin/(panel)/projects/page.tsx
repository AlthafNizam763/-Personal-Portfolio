import type { Metadata } from 'next'
import ProjectsScreen from '@/components/admin/screens/ProjectsScreen'

export const metadata: Metadata = { title: 'Projects' }

export default function Page() {
  return <ProjectsScreen />
}

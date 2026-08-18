import type { Metadata } from 'next'
import ServicesScreen from '@/components/admin/screens/ServicesScreen'

export const metadata: Metadata = { title: 'Services' }

export default function Page() {
  return <ServicesScreen />
}

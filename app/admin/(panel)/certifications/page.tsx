import type { Metadata } from 'next'
import CertificationsScreen from '@/components/admin/screens/CertificationsScreen'

export const metadata: Metadata = { title: 'Certifications' }

export default function Page() {
  return <CertificationsScreen />
}

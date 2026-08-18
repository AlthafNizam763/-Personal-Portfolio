import type { Metadata } from 'next'
import SocialLinksScreen from '@/components/admin/screens/SocialLinksScreen'

export const metadata: Metadata = { title: 'Social Links' }

export default function Page() {
  return <SocialLinksScreen />
}

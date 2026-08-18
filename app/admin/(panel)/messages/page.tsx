import type { Metadata } from 'next'
import MessagesScreen from '@/components/admin/screens/MessagesScreen'

export const metadata: Metadata = { title: 'Messages' }

export default function Page() {
  return <MessagesScreen />
}

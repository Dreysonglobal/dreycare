'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout() {
  const { appUser, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !loading && !appUser) {
      router.push('/')
    }
  }, [appUser, loading, isClient, router])

  if (loading || !isClient || !appUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  switch (appUser.role) {
    case 'admin':
      router.push('/dashboard/admin')
      return null
    case 'doctor':
      router.push('/dashboard/doctor')
      return null
    case 'pharmacy':
      router.push('/dashboard/pharmacy')
      return null
    case 'lab':
      router.push('/dashboard/lab')
      return null
    case 'frontdesk':
      router.push('/dashboard/frontdesk')
      return null
    case 'accounts':
      router.push('/dashboard/accounts')
      return null
    default:
      router.push('/')
      return null
  }
}

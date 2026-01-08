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

  useEffect(() => {
    if (!isClient || !appUser) return

    const roleRoutes: Record<string, string> = {
      admin: '/dashboard/admin',
      doctor: '/dashboard/doctor',
      pharmacy: '/dashboard/pharmacy',
      lab: '/dashboard/lab',
      frontdesk: '/dashboard/frontdesk',
      accounts: '/dashboard/accounts'
    }

    const route = roleRoutes[appUser.role]
    if (route) {
      router.push(route)
    } else {
      router.push('/')
    }
  }, [appUser, isClient, router])

  if (loading || !isClient || !appUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
    </div>
  )
}
